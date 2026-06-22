import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Home as HomeIcon,
  ArrowLeftRight,
  Receipt,
  User,
  Eye,
  EyeOff,
  Send,
  Copy,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import SendMoneyModal from "../components/SendMoneyModal";
import SessionWarningModal from "../components/SessionWarningModal";
import { useSessionTimeout, clearSessionStart } from "../hooks/useSessionTimeout";

function formatUSD(n) {
  const sign = n < 0 ? "−" : "+";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatAccountNumber(num) {
  return num.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [toast, setToast] = useState("");

  const loadData = useCallback(async (userId) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin")
      .eq("id", userId)
      .single();
    if (profile) {
      setFullName(profile.full_name);
      setIsAdmin(profile.is_admin);
    }

    const { data: accountRows } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setAccounts(accountRows || []);

    const accountIds = (accountRows || []).map((a) => a.id);
    if (accountIds.length > 0) {
      const { data: txRows } = await supabase
        .from("transactions")
        .select("*")
        .or(
          `from_account_id.in.(${accountIds.join(",")}),to_account_id.in.(${accountIds.join(",")})`
        )
        .order("created_at", { ascending: false })
        .limit(10);
      setTransactions(txRows || []);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      loadData(session.user.id).then(() => setLoading(false));
    });
  }, [navigate, loadData]);

  async function handleLogout() {
    clearSessionStart();
    await supabase.auth.signOut();
    navigate("/");
  }

  const handleTimeout = useCallback(
    async (reason) => {
      clearSessionStart();
      await supabase.auth.signOut();
      navigate("/login", { state: { reason } });
    },
    [navigate]
  );

  const { showWarning, secondsLeft, stayLoggedIn } = useSessionTimeout(handleTimeout);

  async function handleSendSuccess(result) {
    setShowSendModal(false);
    setToast(`Sent to ${result.to_name}`);
    setTimeout(() => setToast(""), 3000);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) loadData(session.user.id);
  }

  function copyAccountNumber(num) {
    navigator.clipboard?.writeText(num);
    setToast("Account number copied");
    setTimeout(() => setToast(""), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center text-slate text-sm">
        Loading your account…
      </div>
    );
  }

  const account = accounts[activeAccount];

  return (
    <div className="min-h-screen bg-mist flex">
      {/* SIDEBAR — desktop only */}
      <aside className="hidden lg:flex flex-col w-60 bg-ink text-white px-6 py-8 shrink-0">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="w-3 h-3 rounded-sm bg-mint" />
          </span>
          <span className="font-display font-semibold text-lg">Nimbus</span>
        </Link>
        <nav className="space-y-1 text-sm font-medium">
          {[
            ["Home", HomeIcon, true],
            ["Transfers", ArrowLeftRight, false],
            ["Activity", Receipt, false],
            ["Profile", User, false],
          ].map(([label, Icon, active]) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        {isAdmin && (
          <Link
            to="/admin"
            className="mt-4 text-sm font-medium text-mint px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Admin dashboard →
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="mt-auto text-sm text-white/50 hover:text-white transition-colors text-left"
        >
          Log out
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 px-5 sm:px-8 py-8 pb-24 lg:pb-8 max-w-3xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate text-sm">Welcome back,</p>
            <h1 className="font-display text-xl font-semibold text-ink">{fullName}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center font-display font-semibold text-sm">
            {fullName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </header>

        {accounts.length === 0 ? (
          <p className="text-slate text-sm">No accounts found yet — try refreshing.</p>
        ) : (
          <>
            {/* ACCOUNT CARDS */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {accounts.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setActiveAccount(i)}
                  className={`min-w-[260px] text-left rounded-2xl p-5 transition-colors ${
                    i === activeAccount ? "bg-ink text-white" : "bg-paper border border-line text-ink"
                  }`}
                >
                  <p className={`text-xs mb-1 capitalize ${i === activeAccount ? "text-white/60" : "text-slate"}`}>
                    {a.account_type}
                  </p>
                  <p className="num text-2xl font-semibold tracking-tight">
                    {showBalance ? `$${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$••••••"}
                  </p>
                  <p className={`num text-xs mt-3 ${i === activeAccount ? "text-white/50" : "text-slate"}`}>
                    {formatAccountNumber(a.account_number)}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => setShowBalance((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-slate hover:text-ink transition-colors"
              >
                {showBalance ? <EyeOff size={13} /> : <Eye size={13} />}
                {showBalance ? "Hide balance" : "Show balance"}
              </button>
              <button
                onClick={() => copyAccountNumber(account.account_number)}
                className="flex items-center gap-1.5 text-xs text-slate hover:text-ink transition-colors"
              >
                <Copy size={13} />
                Copy account number
              </button>
            </div>

            {account?.frozen && (
              <p className="text-sm text-coral bg-coral/10 rounded-lg px-4 py-2.5 mt-4">
                This account is frozen. Transfers are disabled until it's unfrozen.
              </p>
            )}

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-4 gap-3 mt-8">
              <button
                onClick={() => setShowSendModal(true)}
                disabled={account?.frozen}
                className="flex flex-col items-center gap-2 bg-paper border border-line rounded-xl py-4 hover:border-mint transition-colors disabled:opacity-40 disabled:hover:border-line"
              >
                <Send size={18} className="text-ink" />
                <span className="text-xs font-medium text-ink">Send</span>
              </button>
              <button
                onClick={() => copyAccountNumber(account.account_number)}
                className="flex flex-col items-center gap-2 bg-paper border border-line rounded-xl py-4 hover:border-mint transition-colors"
              >
                <Copy size={18} className="text-ink" />
                <span className="text-xs font-medium text-ink">Receive</span>
              </button>
              <button className="flex flex-col items-center gap-2 bg-paper border border-line rounded-xl py-4 hover:border-mint transition-colors">
                <FileText size={18} className="text-ink" />
                <span className="text-xs font-medium text-ink">Bills</span>
              </button>
              <button className="flex flex-col items-center gap-2 bg-paper border border-line rounded-xl py-4 hover:border-mint transition-colors">
                <MoreHorizontal size={18} className="text-ink" />
                <span className="text-xs font-medium text-ink">More</span>
              </button>
            </div>

            {/* RECENT ACTIVITY */}
            <section className="mt-10">
              <h2 className="font-display font-semibold text-sm text-ink mb-3">Recent activity</h2>
              {transactions.length === 0 ? (
                <p className="text-sm text-slate bg-paper border border-line rounded-2xl px-5 py-6 text-center">
                  No transactions yet. Send your first transfer to see it here.
                </p>
              ) : (
                <div className="bg-paper border border-line rounded-2xl divide-y divide-line">
                  {transactions.map((tx) => {
                    const isOutgoing = accounts.some((a) => a.id === tx.from_account_id);
                    const counterpart = isOutgoing ? tx.to_name : tx.from_name;
                    const signedAmount = isOutgoing ? -tx.amount : tx.amount;
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-ink">{counterpart || "Unknown"}</p>
                          <p className="text-xs text-slate mt-0.5">
                            {isOutgoing ? "Transfer sent" : "Transfer received"} ·{" "}
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`num text-sm font-semibold ${signedAmount > 0 ? "text-mint-deep" : "text-ink"}`}>
                          {formatUSD(signedAmount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* MOBILE TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-line flex justify-around py-3">
        {[
          ["Home", HomeIcon],
          ["Transfers", ArrowLeftRight],
          ["Activity", Receipt],
          ["Profile", User],
        ].map(([label, Icon]) => (
          <button key={label} className="flex flex-col items-center gap-1 text-slate">
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {showSendModal && account && (
        <SendMoneyModal
          fromAccount={account}
          onClose={() => setShowSendModal(false)}
          onSuccess={handleSendSuccess}
        />
      )}

      {showWarning && (
        <SessionWarningModal
          secondsLeft={secondsLeft}
          onStay={stayLoggedIn}
          onLogout={() => handleTimeout("manual")}
        />
      )}

      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
