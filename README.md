# Nimbus Bank — Portfolio Demo

A simulated digital banking app — international/USD-based, no real money moves
anywhere. Built with React + Vite + Tailwind v4, Supabase (auth + database +
atomic transfer logic), deploying to Vercel.

## What's built
- `/` — marketing homepage
- `/signup`, `/login` — real Supabase auth (email + password)
- `/dashboard` — live balances, send-money flow, transaction history, all
  backed by Postgres via Supabase

On signup, a trigger in the database automatically creates a profile, a
checking account, and a 12-digit account number, and credits a $1,000 demo
starting balance.

## Setup

### 1. Install dependencies
Requires Node.js 18+ and npm.
```
npm install
```

### 2. Create a Supabase project
1. Go to supabase.com → New Project (free tier is fine).
2. Once it's up, go to the **SQL Editor** → New query.
3. Paste the entire contents of `supabase/schema.sql` and click Run.
   This creates all tables, the account-number generator, the atomic
   `transfer_funds` function, and row-level security policies.
4. Go to **Authentication → Providers → Email** and turn **off** "Confirm
   email" for now — that way signup logs you straight into the dashboard
   without needing to click a confirmation link. (Turn it back on before
   this ever goes near real users.)
5. Go to **Settings → API** and copy your **Project URL** and **anon public key**.

### 3. Connect the frontend to Supabase
```
cp .env.example .env
```
Paste your URL and anon key into `.env`.

### 4. Run it
```
npm run dev
```
Sign up with a real-looking email (doesn't need to be deliverable if email
confirmation is off), and you'll land in a live dashboard with a real account
number. Open a second browser/incognito window, sign up as a second person,
copy their account number, and send them money from the first account to see
the transfer actually move between two real database rows.

## Deploy to Vercel
1. Push this folder to a GitHub repo (`.env` is gitignored — don't worry,
   your keys won't leak).
2. vercel.com → Add New Project → import the repo.
3. In Vercel's project settings → Environment Variables, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as your `.env`).
4. Deploy.

## How the transfer is actually safe
`transfer_funds` in `supabase/schema.sql` locks both the sender's and
receiver's account rows (`FOR UPDATE`) before touching balances. If two
transfers hit the same account at the same instant, Postgres queues the
second one until the first finishes — so a balance can never be read, debited
twice, and written back wrong. If anything fails partway through (insufficient
funds, bad account number), the whole function rolls back: no partial debit
ever gets stuck without its matching credit.

## Session security (idle timeout + re-auth)

- **Idle timeout**: 5 minutes of no mouse/keyboard/touch activity triggers a
  "Still there?" warning with a 30-second countdown, then auto-logout.
  Tunable in `src/hooks/useSessionTimeout.js`.
- **Absolute timeout**: a hard 30-minute session cap regardless of activity,
  tracked per-tab via `sessionStorage`. Even if you're actively clicking the
  whole time, you're forced to log back in after 30 minutes.
- **Step-up re-auth on transfers**: before any `transfer_funds` call fires,
  `SendMoneyModal` makes you re-enter your password. It's verified via a
  fresh `signInWithPassword` call — independent of whatever session token is
  already active — before the money actually moves.

**Honest limitation**: this is enforced client-side, in the browser, the way
any pure SPA has to. A production bank would also enforce session expiry
server-side (short-lived JWTs, refresh-token rotation, HttpOnly cookies via a
backend) so a tampered client can't just ignore the timer. Worth keeping in
mind if this ever becomes more than a portfolio piece.

## Admin dashboard

Run `supabase/02_admin.sql` in the SQL Editor *after* `schema.sql`. It adds:
- `is_admin` on profiles, `frozen` on accounts
- `admin_adjust_balance` — credit/debit any account, logged to the ledger as type `adjustment`
- `admin_set_frozen` — freeze/unfreeze an account (a frozen account can't send *or* receive transfers — `transfer_funds` checks this)
- RLS policies so admins can see every profile/account/transaction, not just their own

**Make yourself an admin** — there's no UI for this on purpose (you don't
want a signup form that can grant admin). At the bottom of `02_admin.sql`
there's a commented-out line:
```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```
Sign up normally first, then run that one line (with your real email) in the
SQL Editor. An "Admin dashboard →" link will appear in your sidebar.

`/admin` shows every account across all users, a frozen/total-balance
summary, per-account "adjust balance" and "freeze" buttons, and a global
transaction feed. Non-admins who hit `/admin` directly just see "Not
authorized."

## Not built yet (still mock/stub UI)
- "Bills" and "More" quick actions
- Multiple currencies (everything is USD for now)
- Password reset / forgot password flow
- Email notifications on transfer (could reuse the Brevo-via-Vercel-function
  pattern from your other projects)
- KYC onboarding step
