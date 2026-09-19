import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Send, Copy, FileText, MoreHorizontal, Bell, LayoutDashboard, Wallet, CreditCard, Settings, HelpCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import SendMoneyModal from "../components/SendMoneyModal";
import SessionWarningModal from "../components/SessionWarningModal";
import Sidebar from "../components/Sidebar";
import MobileTabBar from "../components/MobileTabBar";
import { useSessionTimeout, clearSessionStart } from "../hooks/useSessionTimeout";
import logoImg from '../assets/Nimbus-logo.png'; 
import logoImgInv from '../assets/Nimbus-Bank-Inverse.png'; 


function formatUSD(n) {
  const sign = n < 0 ? "−" : "+";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatAccountNumber(num) {
  return num.replace(/(\d{4})(?=\d)/g, "$1 ");
}

const ICON_TINTS = ["bg-blue/10 text-blue", "bg-mint/15 text-mint-deep", "bg-coral/10 text-coral"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
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

  // Real counterpart names from transaction history — used as quick-send chips.
  // No fabricated contacts/photos, just whoever you've actually transacted with.
  const recentCounterparts = useMemo(() => {
    const names = new Set();
    transactions.forEach((tx) => {
      const isOutgoing = accounts.some((a) => a.id === tx.from_account_id);
      const name = isOutgoing ? tx.to_name : tx.from_name;
      if (name) names.add(name);
    });
    return [...names].slice(0, 4);
  }, [transactions, accounts]);

  if (loading) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center text-slate text-sm">
        <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse"/>
        <MobileTabBar active="dashboard" />
      </div>
    );
  }

  const account = accounts[activeAccount];
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const MOBILE_NAV_ITEMS = [
    ["Dashboard", LayoutDashboard],
    ["Accounts", Wallet],
    ["Cards", CreditCard],
    ["Settings", Settings],
  ];

  return (
    <div className="min-h-dvh flex">
      <Sidebar
        fullName={fullName}
        isAdmin={isAdmin}
        active="dashboard"
        onTransferClick={() => setShowSendModal(true)}
        onLogout={handleLogout}
      />

      {/* MAIN */}
      <main className="flex-1 px-5 sm:px-8 py-3 sm:py-8 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
          <span className="flex items-center justify-between mb-5">
            <img src={logoImg} alt="Nimbus Bank Logo" className="w-15 h-15 lg:hidden"/>
            <div className="flex items-center gap-3 lg:hidden">
              <button className="relative w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
                <Bell size={18} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-coral border-2 border-mist" />
              </button>
              <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
                <HelpCircle size={18} />
              </button>
            </div>
          </span>

        <header className="flex items-center justify-between mb-8">

          <div>
            <p className="num text-xs font-bold uppercase tracking-wide text-[#2259bf]">{today}</p>
            <h1 className="font-display text-3xl font-semibold text-ink mt-1">Welcome back, <span class="text-[#2259bf]">{fullName.split(" ")[0]}</span></h1>
            
          </div>
          <div className="lg:flex items-center gap-3 hidden">
            <button className="relative w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-coral border-2 border-mist " />
            </button>
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {accounts.length === 0 ? (
          <p className="text-slate text-sm">No accounts found yet — try refreshing.</p>
        ) : (
          <>
            {/* ACCOUNT SWITCHER (only if more than one account) */}
            {accounts.length > 1 && (
              <div className="flex gap-2 mb-3">
                {accounts.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setActiveAccount(i)}
                    className={`num text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
                      i === activeAccount ? "bg-ink text-white" : "bg-paper border border-line text-slate"
                    }`}
                  >
                    {a.account_type}
                  </button>
                ))}
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-5">
              {/* MAIN ACCOUNT CARD */}
              <div
                className="lg:col-span-8 rounded-3xl p-7 flex flex-col justify-between min-h-[220px] relative overflow-hidden"
                style={{ backgroundImage: "linear-gradient(135deg, #0B0B0B 0%, #2259BF 100%)" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="num text-sm text-white/60 capitalize">{account.account_type} Account</p>
                    <h2 className="font-display text-2xl font-semibold text-white mt-1">Nimbus Premier</h2>
                  </div>

                  <img src={logoImgInv} alt="Nimbus Bank Logo" className="w-15 h-15"/>
                </div>

                <div className="mt-6">
                  {!showBalance ? (
                    <button
                      onClick={() => setShowBalance(true)}
                      className="num bg-white text-ink text-sm font-medium px-5 py-2 rounded-full hover:bg-mist transition-colors"
                    >
                      Click for Balance
                    </button>
                  ) : (
                    <button onClick={() => setShowBalance(false)} className="text-left">
                      <p className="num text-4xl font-semibold text-white tracking-tight">
                        ${Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="num text-xs text-white/50 mt-1">Tap to hide</p>
                    </button>
                  )}

                  <div className="flex items-end justify-between mt-5">
                    <p className="num text-sm text-white tracking-widest">{formatAccountNumber(account.account_number)}</p>
                    <button
                      onClick={() => copyAccountNumber(account.account_number)}
                      className="num flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
                    >
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowSendModal(true)}
                  disabled={account?.frozen}
                  className="bg-paper border border-line rounded-2xl py-6 flex flex-col items-center gap-2.5 hover:border-mint transition-colors disabled:opacity-40"
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center ${ICON_TINTS[0]}`}>
                    <Send size={18} />
                  </span>
                  <span className="num text-sm font-medium text-ink">Transfer</span>
                </button>
                <button
                  onClick={() => copyAccountNumber(account.account_number)}
                  className="bg-paper border border-line rounded-2xl py-6 flex flex-col items-center gap-2.5 hover:border-mint transition-colors"
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center ${ICON_TINTS[1]}`}>
                    <Copy size={18} />
                  </span>
                  <span className="num text-sm font-medium text-ink">Receive</span>
                </button>
                <button
                  onClick={() => navigate("/bills")}
                  className="bg-paper border border-line rounded-2xl py-6 flex flex-col items-center gap-2.5 hover:border-mint transition-colors"
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center ${ICON_TINTS[2]}`}>
                    <FileText size={18} />
                  </span>
                  <span className="num text-sm font-medium text-ink">Bills</span>
                </button>
                <button
                  onClick={() => navigate("/more")}
                  className="bg-paper border border-line rounded-2xl py-6 flex flex-col items-center gap-2.5 hover:border-mint transition-colors"
                >
                  <span className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-slate">
                    <MoreHorizontal size={18} />
                  </span>
                  <span className="num text-sm font-medium text-ink">More</span>
                </button>
              </div>
            </div>

            {account?.frozen && (
              <p className="text-sm text-coral bg-coral/10 rounded-xl px-4 py-2.5 mt-4">
                This account is frozen. Transfers are disabled until it's unfrozen.
              </p>
            )}

            {/* CONTENT ROW */}
            <div className="grid lg:grid-cols-3 gap-6 mt-8">
              {/* RECENT ACTIVITY */}
              <section className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-lg text-ink">Recent Activity</h2>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-sm text-slate bg-paper border border-line rounded-2xl px-5 py-6 text-center">
                    No transactions yet. Send your first transfer to see it here.
                  </p>
                ) : (
                  <div className="bg-paper border border-line rounded-2xl divide-y divide-line">
                    {transactions.map((tx, i) => {
                      const isOutgoing = accounts.some((a) => a.id === tx.from_account_id);
                      const counterpart = isOutgoing ? tx.to_name : tx.from_name;
                      const signedAmount = isOutgoing ? -tx.amount : tx.amount;
                      const tint = ICON_TINTS[i % ICON_TINTS.length];
                      return (
                        <Link
                          to={`/transactions/${tx.id}`}
                          key={tx.id}
                          className="flex items-center justify-between px-5 py-4 hover:bg-mist transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className={`w-11 h-11 rounded-full flex items-center justify-center font-display font-semibold text-sm shrink-0 ${tint}`}>
                              {(counterpart || "?")[0].toUpperCase()}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-ink">{counterpart || "Unknown"}</p>
                              <p className="num text-xs text-slate mt-0.5">
                                {isOutgoing ? "Transfer sent" : "Transfer received"} ·{" "}
                                {new Date(tx.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`num text-sm font-semibold ${signedAmount > 0 ? "text-mint-deep" : "text-coral"}`}>
                            {formatUSD(signedAmount)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* SEND MONEY PANEL */}
              <section>
                <h2 className="font-display font-semibold text-lg text-ink mb-3">Send Money</h2>

                {recentCounterparts.length > 0 && (
                  <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
                    {recentCounterparts.map((name) => (
                      <button
                        key={name}
                        onClick={() => setShowSendModal(true)}
                        className="flex flex-col items-center gap-1.5 shrink-0"
                      >
                        <span className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center font-display font-semibold">
                          {name[0].toUpperCase()}
                        </span>
                        <span className="num text-xs text-slate max-w-[56px] truncate">{name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-muted border border-line rounded-2xl p-5">
                  <p className="num text-sm text-slate mb-4">Send to any Nimbus account number, instantly.</p>
                  <button
                    onClick={() => setShowSendModal(true)}
                    disabled={account?.frozen}
                    className="num w-full bg-ink text-white text-sm font-medium py-3.5 rounded-xl hover:bg-mint-deep transition-colors disabled:opacity-40"
                  >
                    Send Now
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* MOBILE TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-line flex justify-around py-3">
        {MOBILE_NAV_ITEMS.map(([label, Icon]) => (
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
      <MobileTabBar active="dashboard" />
    </div>
  );
}