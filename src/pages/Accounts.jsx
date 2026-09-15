import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Landmark, PiggyBank, Briefcase, Plus, ArrowRight, ShieldCheck, Bell, HelpCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import MobileTabBar from "../components/MobileTabBar";
import logoImg from '../assets/Nimbus-logo.png'; 


const TYPE_ICON = { checking: Landmark, savings: PiggyBank, business: Briefcase };
const MISSING_TYPES = [
  { type: "savings", label: "Savings Account", body: "Earn interest on money you're setting aside." },
  { type: "business", label: "Business Account", body: "Keep business cash flow separate from personal." },
];

function OpenAccountModal({ type, label, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleOpen() {
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("open_account", { p_account_type: type });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6 text-center">
        <h2 className="font-display font-semibold text-lg text-ink">Open a {label}?</h2>
        <p className="text-slate text-sm mt-2">
          You'll get a new account number instantly, starting at $0.00.
        </p>
        {error && <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mt-4">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-line text-ink font-semibold py-2.5 rounded-full">
            Cancel
          </button>
          <button
            onClick={handleOpen}
            disabled={saving}
            className="flex-1 bg-mint text-ink font-bold py-2.5 rounded-full hover:bg-mint-deep transition-colors disabled:opacity-60"
          >
            {saving ? "Opening…" : "Open Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Accounts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [openModalType, setOpenModalType] = useState(null);

  const loadData = useCallback(async (id) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin")
      .eq("id", id)
      .single();
    if (profile) {
      setFullName(profile.full_name);
      setIsAdmin(profile.is_admin);
    }

    const { data: accountRows } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: true });
    setAccounts(accountRows || []);

    const { data: walletRows } = await supabase.from("wallets").select("*").eq("user_id", id);
    setWallets(walletRows || []);

    const accountIds = (accountRows || []).map((a) => a.id);
    if (accountIds.length > 0) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: txRows } = await supabase
        .from("transactions")
        .select("*")
        .in("from_account_id", accountIds)
        .gte("created_at", startOfMonth.toISOString());
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

  function handleOpenSuccess() {
    setOpenModalType(null);
    supabase.auth.getSession().then(({ data: { session } }) => loadData(session.user.id));
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-slate text-sm">
        <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse"/>
        <MobileTabBar active="accounts" />
        
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const existingTypes = new Set(accounts.map((a) => a.account_type));
  const missingTypes = MISSING_TYPES.filter((m) => !existingTypes.has(m.type));

  const spendingByCategory = {};
  transactions.forEach((tx) => {
    const cat = tx.type === "transfer" ? "Transfers" : tx.note ? tx.note[0].toUpperCase() + tx.note.slice(1) : "Other";
    spendingByCategory[cat] = (spendingByCategory[cat] || 0) + Number(tx.amount);
  });
  const categoryEntries = Object.entries(spendingByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const dotColors = ["bg-ink", "bg-link", "bg-blue", "bg-mint-deep", "bg-coral"];

  return (
    <div className="min-h-dvh flex">
      <Sidebar
        fullName={fullName}
        isAdmin={isAdmin}
        active="accounts"
        onTransferClick={() => navigate("/dashboard")}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/"); }}
      />

      <main className="flex-1 px-5 sm:px-8 py-8 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <div className="invisible" />
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <Bell size={18} />
            </button>
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Your <span className="text-link">Accounts</span>
            </h1>
            <p className="text-slate mt-2 max-w-md">
              A comprehensive overview of your wealth at Nimbus.
            </p>
          </div>
          <div className="bg-paper border border-line rounded-2xl px-6 py-5 shadow-sm">
            <p className="num text-xs text-label uppercase tracking-wide">Total Combined Balance</p>
            <p className="num text-3xl font-semibold text-ink mt-1">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ACCOUNT BENTO GRID */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {accounts.map((a) => {
            const Icon = TYPE_ICON[a.account_type] || Landmark;
            const isSavings = a.account_type === "savings";
            const goalPct = a.goal_amount ? Math.min(100, (a.balance / a.goal_amount) * 100) : null;
            return (
              <div
                key={a.id}
                className={`rounded-2xl p-7 flex flex-col justify-between min-h-[180px] ${
                  isSavings ? "text-white" : "bg-paper border border-line"
                }`}
                style={isSavings ? { backgroundImage: "linear-gradient(135deg, #0B0B0B 0%, #2259BF 100%)" } : {}}
              >
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSavings ? "bg-white/10" : "bg-muted-2"}`}>
                  <Icon size={18} className={isSavings ? "text-white" : "text-slate"} />
                </span>
                <div className="mt-6">
                  <p className="capitalize">{a.account_type} Account</p>
                  <p className={`num text-sm mt-1 ${isSavings ? "text-white/60" : "text-slate"}`}>
                    Acc: **** {a.account_number.slice(-4)}
                  </p>
                  <p className="num text-2xl font-bold mt-2">
                    ${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  {isSavings && goalPct !== null && (
                    <div className="mt-4">
                      <div className="flex justify-between num text-[11px] text-white/50 uppercase mb-1.5">
                        <span>Goal progress</span>
                        <span>{goalPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-mint" style={{ width: `${goalPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {missingTypes.map((m) => (
            <button
              key={m.type}
              onClick={() => setOpenModalType(m.type)}
              className="rounded-2xl p-7 border-2 border-dashed border-line flex flex-col items-start justify-between min-h-[180px] hover:border-slate transition-colors text-left"
            >
              <span className="w-11 h-11 rounded-xl bg-muted-2 flex items-center justify-center">
                <Plus size={18} className="text-slate" />
              </span>
              <div className="mt-6">
                <p className="text-ink font-medium">{m.label}</p>
                <p className="text-slate text-sm mt-1">{m.body}</p>
              </div>
            </button>
          ))}
        </div>

        {/* MULTI-CURRENCY WALLET */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-ink">Multi-Currency Wallet</h2>
            <Link to="/exchange" className="num text-link text-sm font-medium flex items-center gap-1">
              Manage Wallets <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="bg-paper border border-line rounded-xl p-5">
              <p className="num text-slate text-sm">US Dollar (USD)</p>
              <p className="text-ink text-xl font-bold mt-2">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            {wallets.map((w) => (
              <div key={w.id} className="bg-paper border border-line rounded-xl p-5">
                <p className="num text-slate text-sm">
                  {w.currency === "EUR" ? "Euro (EUR)" : w.currency === "GBP" ? "British Pound (GBP)" : "Bitcoin (BTC)"}
                </p>
                <p className="text-ink text-xl font-bold mt-2">
                  {w.currency === "BTC"
                    ? `${Number(w.balance).toFixed(4)} BTC`
                    : `${w.currency === "EUR" ? "€" : "£"}${Number(w.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SPENDING + SECURITY */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-paper border border-line rounded-2xl p-6">
            <h3 className="text-ink mb-4">Spending by Category (this month)</h3>
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-slate">No spending recorded yet this month.</p>
            ) : (
              <div className="space-y-3">
                {categoryEntries.map(([cat, amt], i) => (
                  <div key={cat} className="flex items-center justify-between border-b border-line last:border-0 pb-3 last:pb-0">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColors[i % dotColors.length]}`} />
                      {cat}
                    </span>
                    <span className="num text-sm text-ink">${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link to="/profile" className="bg-muted border border-line rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-slate transition-colors">
            <span className="w-14 h-14 rounded-full bg-paper border border-line flex items-center justify-center mb-3">
              <ShieldCheck size={22} className="text-mint-deep" />
            </span>
            <p className="text-ink font-medium">Secured with Nimbus Shield</p>
            <p className="text-slate text-sm mt-1 max-w-xs">
              Your accounts are protected by multi-layer encryption and real-time monitoring.
            </p>
            <span className="num text-link text-sm font-medium mt-3">Review Security Policy</span>
          </Link>
        </div>
      </main>

      {openModalType && (
        <OpenAccountModal
          type={openModalType}
          label={MISSING_TYPES.find((m) => m.type === openModalType).label}
          onClose={() => setOpenModalType(null)}
          onSuccess={handleOpenSuccess}
        />
      )}
      <MobileTabBar active="accounts" />
    </div>
  );
}