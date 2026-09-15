import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, Bell, HelpCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import logoImg from '../assets/Nimbus-logo.png';

const CURRENCIES = ["EUR", "GBP", "BTC"];
const SYMBOL = { EUR: "€", GBP: "£", BTC: "" };

export default function Exchange() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [history, setHistory] = useState([]);
  const [rates, setRates] = useState(null); // { EUR, GBP, BTC } = units of currency per 1 USD (BTC per USD is tiny)
  const [ratesError, setRatesError] = useState("");

  const [direction, setDirection] = useState("buy"); // buy: USD -> currency, sell: currency -> USD
  const [currency, setCurrency] = useState("EUR");
  const [amount, setAmount] = useState("1000");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const loadData = useCallback(async (id) => {
    const { data: profile } = await supabase.from("profiles").select("full_name, is_admin").eq("id", id).single();
    if (profile) {
      setFullName(profile.full_name);
      setIsAdmin(profile.is_admin);
    }
    const { data: accountRows } = await supabase.from("accounts").select("*").eq("user_id", id).order("created_at");
    setAccounts(accountRows || []);

    const accountIds = (accountRows || []).map((a) => a.id);
    const { data: txRows } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "exchange")
      .in("from_account_id", accountIds)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(txRows || []);
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

  useEffect(() => {
    async function fetchRates() {
      try {
        const [fiatRes, btcRes] = await Promise.all([
          fetch("https://open.er-api.com/v6/latest/USD"),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"),
        ]);
        const fiat = await fiatRes.json();
        const btc = await btcRes.json();
        setRates({
          EUR: fiat.rates.EUR,
          GBP: fiat.rates.GBP,
          BTC: 1 / btc.bitcoin.usd, // BTC per 1 USD
        });
      } catch {
        setRatesError("Couldn't reach live rate providers right now.");
      }
    }
    fetchRates();
  }, []);

  const account = accounts[0];
  const numericAmount = parseFloat(amount) || 0;
  const rate = rates?.[currency];
  const convertedAmount =
    rate != null ? (direction === "buy" ? numericAmount * rate : numericAmount / rate) : null;

  async function handleConfirm() {
    setError("");
    if (!account || rate == null || numericAmount <= 0) return;

    const usdAmount = direction === "buy" ? numericAmount : convertedAmount;
    const foreignAmount = direction === "buy" ? convertedAmount : numericAmount;

    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc("exchange_currency", {
      p_account_id: account.id,
      p_currency: currency,
      p_usd_amount: usdAmount,
      p_foreign_amount: foreignAmount,
      p_direction: direction,
    });
    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setToast("Exchange complete");
    setTimeout(() => setToast(""), 2000);
    loadData(account.user_id);
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-slate text-sm">
      <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse"/>
    </div>;
  }

  return (
    <div className="min-h-dvhex">
      <Sidebar
        fullName={fullName}
        isAdmin={isAdmin}
        active="accounts"
        onTransferClick={() => navigate("/dashboard")}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/"); }}
      />

      <main className="flex-1 px-5 sm:px-8 py-8 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
        <header className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Currency Exchange</h1>
            <p className="text-slate mt-2">Live market rates, fetched in your browser as you trade.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <Bell size={18} />
            </button>
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {ratesError && <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{ratesError}</p>}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* CALCULATOR */}
          <div className="lg:col-span-2 bg-paper border border-line rounded-xl p-7">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setDirection("buy")}
                className={`num text-sm px-4 py-2 rounded-full font-medium ${direction === "buy" ? "bg-ink text-white" : "bg-muted text-slate"}`}
              >
                Buy {currency}
              </button>
              <button
                onClick={() => setDirection("sell")}
                className={`num text-sm px-4 py-2 rounded-full font-medium ${direction === "sell" ? "bg-ink text-white" : "bg-muted text-slate"}`}
              >
                Sell {currency}
              </button>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="num ml-auto px-3 py-2 rounded-full border border-line text-sm"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {error && <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>}

            <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="bg-muted rounded-xl p-5">
                <p className="num text-xs text-label uppercase mb-2">{direction === "buy" ? "From USD" : `From ${currency}`}</p>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="num bg-transparent text-3xl font-bold text-ink w-full focus:outline-none"
                />
                {direction === "buy" && account && (
                  <p className="num text-xs text-slate mt-2">
                    Balance: ${Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              <span className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center mx-auto">
                <ArrowUpDown size={16} />
              </span>

              <div className="bg-muted rounded-xl p-5">
                <p className="num text-xs text-label uppercase mb-2">{direction === "buy" ? `To ${currency}` : "To USD"}</p>
                <p className="num text-3xl font-bold text-link">
                  {convertedAmount != null
                    ? currency === "BTC" && direction !== "sell"
                      ? convertedAmount.toFixed(6)
                      : convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-5 border-t border-line">
              <div>
                {rate != null ? (
                  <p className="text-ink text-sm font-semibold">
                    1 USD = {currency === "BTC" ? rate.toFixed(8) : rate.toFixed(4)} {currency}
                  </p>
                ) : (
                  <p className="text-slate text-sm">Fetching live rate…</p>
                )}
                <p className="num text-slate text-xs mt-0.5">Live, from open.er-api.com / CoinGecko</p>
              </div>
              <button
                onClick={handleConfirm}
                disabled={submitting || rate == null || numericAmount <= 0}
                className="num bg-mint text-ink font-bold px-8 py-3.5 rounded-xl hover:bg-mint-deep transition-colors disabled:opacity-50"
              >
                {submitting ? "Exchanging…" : "Confirm Exchange"}
              </button>
            </div>
          </div>

          {/* LIVE MARKET */}
          <div className="space-y-5">
            <div className="bg-paper border border-line rounded-xl p-6">
              <h3 className="text-ink mb-4">Live Market</h3>
              {!rates ? (
                <p className="text-slate text-sm">Loading rates…</p>
              ) : (
                <div className="space-y-3">
                  {CURRENCIES.map((c) => (
                    <div key={c} className="flex items-center justify-between border-b border-line last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="text-ink font-bold text-sm">USD / {c}</p>
                        <p className="num text-slate text-xs">{c === "BTC" ? rates[c].toFixed(8) : rates[c].toFixed(4)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECENT CONVERSIONS */}
        <section className="mt-8 bg-paper border border-line rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h3 className="text-ink">Recent Conversions</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate text-center py-8">No exchanges yet — try one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-mist">
                  <tr className="num text-xs text-slate uppercase text-left">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">From</th>
                    <th className="px-6 py-3">To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {history.map((tx) => {
                    const fromIsUsd = tx.from_name === "USD";
                    const fromAmt = fromIsUsd ? `$${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : tx.note;
                    const toAmt = fromIsUsd ? tx.note : `$${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    return (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 text-slate">{new Date(tx.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                        <td className="px-6 py-4 text-ink font-medium">{fromAmt}</td>
                        <td className="px-6 py-4 text-link font-medium">{toAmt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}