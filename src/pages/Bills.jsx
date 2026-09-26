import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, History, Repeat, ShieldCheck, ChevronLeft, ChevronRight, Bell, HelpCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import MobileTabBar from "../components/MobileTabBar";
import AddBillerModal from "../components/AddBillerModal";
import logoImg from '../assets/Nimbus-logo.png';

const CATEGORY_TAGS = { utilities:"bg-muted-2 text-slate", rent:"bg-muted-2 text-slate", subscription:"bg-muted-2 text-slate", insurance:"bg-muted-2 text-slate", other:"bg-muted-2 text-slate" };

function daysUntil(dateStr) {
  const due = new Date(dateStr); const now = new Date();
  due.setHours(0,0,0,0); now.setHours(0,0,0,0);
  return Math.round((due - now) / 86400000);
}

function MiniCalendar({ dueDates }) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear(); const month = cursor.getMonth();
  const today = new Date(); const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const dueDaySet = new Set(dueDates.filter((d) => d.getFullYear() === year && d.getMonth() === month).map((d) => d.getDate()));
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  return (
    <div className="bg-paper border border-line rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-ink">{cursor.toLocaleString(undefined, { month: "long" })}</p>
        <div className="flex gap-2">
          <button onClick={() => setCursor(new Date(year, month-1, 1))} className="text-slate hover:text-ink"><ChevronLeft size={14} /></button>
          <button onClick={() => setCursor(new Date(year, month+1, 1))} className="text-slate hover:text-ink"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 num text-xs font-bold text-slate text-center mb-2">
        {["M","T","W","T","F","S","S"].map((d,i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div key={i} className={`num aspect-square flex items-center justify-center text-[11px] rounded-md relative ${d===null?"":isToday(d)?"bg-ink text-white":dueDaySet.has(d)?"bg-blue-active text-blue-active-text":"text-ink"}`}>
            {d}
            {d !== null && dueDaySet.has(d) && !isToday(d) && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-link" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Bills() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [billers, setBillers] = useState([]);
  const [history, setHistory] = useState([]);
  const [payingId, setPayingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");

  const loadData = useCallback(async (id) => {
    const { data: profile } = await supabase.from("profiles").select("full_name, is_admin").eq("id", id).single();
    if (profile) { setFullName(profile.full_name); setIsAdmin(profile.is_admin); }
    const { data: accountRows } = await supabase.from("accounts").select("*").eq("user_id", id).order("created_at", { ascending: true });
    setAccounts(accountRows || []);
    const { data: billerRows } = await supabase.from("billers").select("*").eq("user_id", id).order("due_date", { ascending: true });
    setBillers(billerRows || []);
    const accountIds = (accountRows || []).map((a) => a.id);
    if (accountIds.length > 0) {
      const { data: txRows } = await supabase.from("transactions").select("*").eq("type", "bill").in("from_account_id", accountIds).order("created_at", { ascending: false }).limit(10);
      setHistory(txRows || []);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      loadData(session.user.id).then(() => setLoading(false));
    });
  }, [navigate, loadData]);

  async function handlePayNow(biller) {
    if (!accounts[0]) return;
    setPayingId(biller.id);
    const { data, error } = await supabase.rpc("pay_bill", { p_biller_id: biller.id, p_account_id: accounts[0].id });
    setPayingId(null);
    if (error) { setToast(error.message.replace(/^.*?:\s*/, "")); } else { setToast(`Paid ${data.biller_name}`); loadData(userId); }
    setTimeout(() => setToast(""), 2500);
  }

  async function handleToggleAutopay(biller) {
    await supabase.from("billers").update({ autopay: !biller.autopay }).eq("id", biller.id);
    loadData(userId);
  }

  function handleAddSuccess() {
    setShowAddModal(false); setToast("Biller added"); setTimeout(() => setToast(""), 2000); loadData(userId);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse" />
        <MobileTabBar active="bills" />
      </div>
    );
  }

  const totalDue = billers.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const autopayBillers = billers.filter((b) => b.autopay);
  const dueDates = billers.map((b) => new Date(b.due_date));

  return (
    <div className="min-h-dvh flex">
      <Sidebar fullName={fullName} isAdmin={isAdmin} active="bills"
        onTransferClick={() => navigate("/dashboard")}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/"); }} />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-0 z-30 lg:hidden bg-mist/95 backdrop-blur-sm border-b border-line px-5 py-3 flex items-center justify-between shrink-0">
          <img src={logoImg} alt="Nimbus Bank Logo" className="h-10 w-auto" />
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <Bell size={18} /><span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-coral border-2 border-mist" />
            </button>
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>

        <main className="flex-1 min-w-0 px-5 sm:px-8 py-6 pb-24 lg:py-8 lg:pb-10 overflow-x-hidden">
          <header className="flex items-center justify-between mb-8">
            <h1 className="font-display text-xl font-bold text-ink">Bills &amp; Payments</h1>
            <div className="hidden lg:flex items-center gap-3">
              <button className="relative w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink"><Bell size={18} /><span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-coral border-2 border-mist" /></button>
              <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink"><HelpCircle size={18} /></button>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-5 mb-8">
            <div className="lg:col-span-2">
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                Manage your bills with <span className="text-link">precision.</span>
              </h2>
              <p className="text-slate text-lg mt-3">Total due this month: <span className="font-bold text-ink">${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
            </div>
            <div className="rounded-3xl p-7 flex flex-col justify-between text-white" style={{ backgroundImage: "linear-gradient(135deg, #0B0B0B 0%, #2259BF 100%)" }}>
              <div>
                <p className="num text-xs text-white/70 uppercase tracking-wide mb-1">Current Balance</p>
                <p className="num text-2xl font-semibold">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="num bg-white text-ink text-sm font-medium px-5 py-2.5 rounded-xl mt-4 hover:bg-mist transition-colors self-start">
                + Add New Biller
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-paper border border-line rounded-xl p-6">
                <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                  <div className="flex items-center gap-2"><Clock size={18} className="text-ink" /><h3 className="text-ink">Upcoming Bills</h3></div>
                  <span className="num text-sm text-slate">{billers.length} Items</span>
                </div>
                {billers.length === 0 ? (
                  <p className="text-sm text-slate text-center py-6">No billers yet. Add one to start tracking payments.</p>
                ) : (
                  <div className="space-y-3">
                    {billers.map((b) => {
                      const left = daysUntil(b.due_date); const overdue = left <= 2;
                      return (
                        <div key={b.id} className="bg-muted rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-ink text-sm">{b.name}</p>
                            <p className={`num text-sm mt-0.5 ${overdue ? "text-coral" : "text-slate"}`}>
                              {overdue && left >= 0 ? `Due in ${left} day${left===1?"":"s"}` : `Due ${new Date(b.due_date).toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" })}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="num text-sm text-ink">${Number(b.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <button onClick={() => handlePayNow(b)} disabled={payingId === b.id}
                              className="num bg-ink text-white text-sm px-5 py-2 rounded-lg hover:bg-mint-deep transition-colors disabled:opacity-60">
                              {payingId === b.id ? "Paying…" : "Pay Now"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="bg-paper border border-line rounded-xl p-6">
                <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
                  <History size={18} className="text-ink" /><h3 className="text-ink">Payment History</h3>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-slate text-center py-6">No bills paid yet — payments you make will show up here.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="num text-xs text-slate uppercase tracking-wide text-left">
                          <th className="pb-3">Biller</th><th className="pb-3">Date</th><th className="pb-3">Category</th><th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {history.map((tx) => (
                          <tr key={tx.id} onClick={() => navigate(`/transactions/${tx.id}`)} className="cursor-pointer hover:bg-mist transition-colors">
                            <td className="py-3 text-ink">{tx.to_name}</td>
                            <td className="num py-3 text-slate">{new Date(tx.created_at).toLocaleDateString(undefined, { month:"short", day:"2-digit", year:"numeric" })}</td>
                            <td className="py-3"><span className={`num text-xs px-3 py-1 rounded-full uppercase ${CATEGORY_TAGS[tx.note] || CATEGORY_TAGS.other}`}>{tx.note || "other"}</span></td>
                            <td className="num py-3 text-ink text-right">${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-paper border border-line rounded-xl p-6">
                <div className="flex items-center gap-2 border-b border-line pb-3 mb-4"><Repeat size={16} className="text-ink" /><h3 className="text-ink">Autopay</h3></div>
                {billers.length === 0 ? <p className="text-sm text-slate">No billers on autopay yet.</p> : (
                  <div className="space-y-3">
                    {billers.map((b) => (
                      <div key={b.id} className="bg-muted rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="text-ink text-sm font-medium">{b.name}</p>
                          <p className={`num text-sm ${b.autopay ? "text-link" : "text-slate"}`}>{b.autopay ? "Active" : "Paused"}</p>
                        </div>
                        <button onClick={() => handleToggleAutopay(b)}
                          className={`w-11 h-6 rounded-full relative transition-colors ${b.autopay ? "bg-link" : "bg-border-soft"}`}>
                          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: b.autopay ? "22px" : "2px" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <MiniCalendar dueDates={dueDates} />
              <section className="bg-muted border border-line rounded-xl p-5 flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-paper flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-mint-deep" />
                </span>
                <div>
                  <p className="text-ink text-sm font-medium">Secure Payments</p>
                  <p className="text-slate text-xs mt-0.5">Protected by Nimbus bank-grade encryption.</p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {showAddModal && <AddBillerModal userId={userId} onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-40">{toast}</div>}
      <MobileTabBar active="bills" />
    </div>
  );
}