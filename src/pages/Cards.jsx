import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Snowflake, Sun, AlertTriangle, Plus, Bell, HelpCircle, MapPin } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import MobileTabBar from "../components/MobileTabBar";
import logoImg from '../assets/Nimbus-logo.png'; 


function OrderCardModal({ accounts, onClose, onSuccess }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [cardType, setCardType] = useState("debit");
  const [nickname, setNickname] = useState("Nimbus Card");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("order_card", {
      p_account_id: accountId,
      p_card_type: cardType,
      p_nickname: nickname,
    });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <h2 className="font-display font-semibold text-lg text-ink mb-4">Order New Card</h2>
        {error && <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="num text-xs text-label uppercase">Linked Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm capitalize"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.account_type} **** {a.account_number.slice(-4)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="num text-xs text-label uppercase">Card Type</label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm capitalize"
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div>
            <label className="num text-xs text-label uppercase">Nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-line text-ink font-semibold py-2.5 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-ink text-white font-bold py-2.5 rounded-lg disabled:opacity-60">
              {saving ? "Ordering…" : "Order Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustLimitModal({ card, onClose, onSuccess }) {
  const [limit, setLimit] = useState(card.spending_limit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("card_adjust_limit", {
      p_card_id: card.id,
      p_new_limit: parseFloat(limit),
    });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <h2 className="font-display font-semibold text-lg text-ink mb-4">Adjust Monthly Limit</h2>
        {error && <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            step="0.01"
            min="1"
            required
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="num w-full px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-line text-ink font-semibold py-2.5 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-ink text-white font-bold py-2.5 rounded-lg disabled:opacity-60">
              {saving ? "Saving…" : "Save Limit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SimulatePurchaseModal({ card, onClose, onSuccess }) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("card_simulate_purchase", {
      p_card_id: card.id,
      p_merchant: merchant,
      p_amount: parseFloat(amount),
      p_category: category,
    });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <h2 className="font-display font-semibold text-lg text-ink mb-1">Simulate Purchase</h2>
        <p className="text-slate text-xs mb-4">Demo helper — generates a real, atomic card transaction.</p>
        {error && <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant name"
            className="w-full px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm" />
          <input type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount" className="num w-full px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm">
            {["Shopping", "Dining", "Travel", "Electronics", "Groceries"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-line text-ink font-semibold py-2.5 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-ink text-white font-bold py-2.5 rounded-lg disabled:opacity-60">
              {saving ? "Charging…" : "Charge Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Cards() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(0);
  const [activity, setActivity] = useState([]);
  const [modal, setModal] = useState(null); // 'order' | 'limit' | 'purchase'
  const [toast, setToast] = useState("");

  const loadData = useCallback(async (id) => {
    const { data: profile } = await supabase.from("profiles").select("full_name, is_admin").eq("id", id).single();
    if (profile) {
      setFullName(profile.full_name);
      setIsAdmin(profile.is_admin);
    }

    const { data: accountRows } = await supabase.from("accounts").select("*").eq("user_id", id);
    setAccounts(accountRows || []);

    const { data: cardRows } = await supabase.from("cards").select("*").eq("user_id", id).order("created_at");
    setCards(cardRows || []);

    const { data: txRows } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "card_purchase")
      .in("from_account_id", (accountRows || []).map((a) => a.id))
      .order("created_at", { ascending: false })
      .limit(10);
    setActivity(txRows || []);
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

  function refresh() {
    supabase.auth.getSession().then(({ data: { session } }) => loadData(session.user.id));
  }

  async function handleToggleStatus(card) {
    const next = card.status === "active" ? "frozen" : "active";
    await supabase.rpc("card_set_status", { p_card_id: card.id, p_status: next });
    setToast(next === "frozen" ? "Card frozen" : "Card unfrozen");
    setTimeout(() => setToast(""), 2000);
    refresh();
  }

  async function handleReportLost(card) {
    await supabase.rpc("card_set_status", { p_card_id: card.id, p_status: "reported_lost" });
    setToast("Card reported lost — it's now permanently disabled");
    setTimeout(() => setToast(""), 2500);
    refresh();
  }

  async function handleToggleControl(card, field) {
    const next = {
      allow_online: card.allow_online,
      allow_international: card.allow_international,
      allow_contactless: card.allow_contactless,
    };
    next[field] = !next[field];
    await supabase.rpc("card_update_controls", {
      p_card_id: card.id,
      p_allow_online: next.allow_online,
      p_allow_international: next.allow_international,
      p_allow_contactless: next.allow_contactless,
    });
    refresh();
  }

  function handleModalSuccess() {
    setModal(null);
    setToast("Done");
    setTimeout(() => setToast(""), 1800);
    refresh();
  }

  if (loading) {
      
    return 
    <div className="min-h-dvh flex items-center justify-center text-slate text-sm">
      <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse"/>
      <MobileTabBar active="cards" />
    </div>;
  }

  const card = cards[activeCard];

  return (
    <div className="min-h-dvh flex">
      <Sidebar
        fullName={fullName}
        isAdmin={isAdmin}
        active="cards"
        onTransferClick={() => navigate("/dashboard")}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/"); }}
      />

      <main className="overflow-x-hidden flex-1 px-5 sm:px-8 py-8 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
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
        <header className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Cards <span className="text-link">Management</span>
            </h1>
            <p className="text-slate mt-2 max-w-md">Securely control your cards with real-time spending controls.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setModal("order")} className="num bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
              + Order New Card
            </button>
            <div className="lg:flex items-center gap-3 hidden">
            <button className="relative w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-coral border-2 border-mist " />
            </button>
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <HelpCircle size={18} />
            </button>
          </div>
          </div>

          
        </header>

        {cards.length === 0 ? (
          <p className="text-slate text-sm bg-paper border border-line rounded-2xl px-6 py-10 text-center">
            No cards yet — order one to get started.
          </p>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-paper border border-line rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-ink">Your Active Cards</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {cards.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCard(i)}
                      className="shrink-0 w-[300px] h-[180px] rounded-2xl p-6 flex flex-col justify-between text-left text-white relative overflow-hidden"
                      style={{
                        backgroundImage:
                          c.card_type === "credit"
                            ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
                            : "linear-gradient(135deg, #00668A 0%, #40C2FD 100%)",
                        outline: i === activeCard ? "2px solid #949393" : "none",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="num text-xs tracking-widest uppercase text-white/70">{c.nickname}</p>
                          <p className="text-sm mt-1">{c.card_type === "credit" ? "Credit Card" : "Everyday Use"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="num text-lg tracking-widest mb-3">**** **** **** {c.last4}</p>
                        <div className="flex gap-8">
                          <div>
                            <p className="num text-[10px] text-white/50 uppercase">Expires</p>
                            <p className="num text-sm">{String(c.expiry_month).padStart(2, "0")} / {String(c.expiry_year).slice(-2)}</p>
                          </div>
                          <div>
                            <p className="num text-[10px] text-white/50 uppercase">Status</p>
                            <p className={`num text-sm flex items-center gap-1.5 ${c.status === "active" ? "text-mint" : "text-coral"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-mint" : "bg-coral"}`} />
                              {c.status === "reported_lost" ? "Lost" : c.status === "frozen" ? "Frozen" : "Active"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {card && (
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-line">
                    <button
                      onClick={() => handleToggleStatus(card)}
                      disabled={card.status === "reported_lost"}
                      className="flex flex-col items-center gap-2 bg-muted rounded-xl py-4 disabled:opacity-40"
                    >
                      {card.status === "active" ? <Snowflake size={18} className="text-ink" /> : <Sun size={18} className="text-ink" />}
                      <span className="num text-sm text-ink">{card.status === "active" ? "Freeze Card" : "Unfreeze"}</span>
                    </button>
                    <button onClick={() => setModal("purchase")} className="flex flex-col items-center gap-2 bg-muted rounded-xl py-4">
                      <Plus size={18} className="text-ink" />
                      <span className="num text-sm text-ink">Simulate Purchase</span>
                    </button>
                    <button
                      onClick={() => handleReportLost(card)}
                      disabled={card.status === "reported_lost"}
                      className="flex flex-col items-center gap-2 bg-muted rounded-xl py-4 disabled:opacity-40"
                    >
                      <AlertTriangle size={18} className="text-coral" />
                      <span className="num text-sm text-coral">Report Lost</span>
                    </button>
                  </div>
                )}
              </section>

              <section className="bg-paper border border-line rounded-xl p-6">
                <h3 className="text-ink mb-4">Recent Activity</h3>
                {activity.length === 0 ? (
                  <p className="text-sm text-slate text-center py-6">No card purchases yet.</p>
                ) : (
                  <div className="space-y-1">
                    {activity.map((tx) => (
                      <Link
                        key={tx.id}
                        to={`/transactions/${tx.id}`}
                        className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-mist transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-11 h-11 rounded-xl bg-muted-2 flex items-center justify-center font-display font-semibold text-ink">
                            {tx.to_name[0].toUpperCase()}
                          </span>
                          <div>
                            <p className="text-ink font-bold text-sm">{tx.to_name}</p>
                            <p className="num text-slate text-sm">{tx.note} · {new Date(tx.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                          </div>
                        </div>
                        <span className="num text-sm text-ink">-${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              {card && (
                <>
                  <section className="bg-paper border border-line rounded-xl p-6">
                    <h3 className="text-ink mb-4">Monthly Spending</h3>
                    <div className="flex items-end justify-between mb-2">
                      <p className="num text-xs text-slate uppercase">Current usage</p>
                      <p className="num text-ink font-bold text-sm">
                        ${Number(card.monthly_spend).toLocaleString()} / ${Number(card.spending_limit).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-3 rounded-full bg-muted-2 overflow-hidden">
                      <div
                        className="h-3 bg-link rounded-full"
                        style={{ width: `${Math.min(100, (card.monthly_spend / card.spending_limit) * 100)}%` }}
                      />
                    </div>
                    <p className="num text-slate text-sm mt-3">
                      {((card.monthly_spend / card.spending_limit) * 100).toFixed(0)}% of your monthly limit used
                    </p>
                    <button
                      onClick={() => setModal("limit")}
                      className="w-full border-2 border-dashed border-line text-ink font-bold py-3 rounded-xl mt-4"
                    >
                      Adjust Limit
                    </button>
                  </section>

                  <section className="bg-paper border border-line rounded-xl p-6">
                    <h3 className="text-ink mb-5">Security Governance</h3>
                    <div className="space-y-5">
                      {[
                        ["allow_online", "Online Payments", "Enable web transactions"],
                        ["allow_international", "International Use", "Allow usage outside US"],
                        ["allow_contactless", "Contactless", "Tap to pay functionality"],
                      ].map(([field, label, sub]) => (
                        <div key={field} className="flex items-center justify-between">
                          <div>
                            <p className="text-ink text-sm font-medium">{label}</p>
                            <p className="text-slate text-xs">{sub}</p>
                          </div>
                          <button
                            onClick={() => handleToggleControl(card, field)}
                            className={`w-11 h-6 rounded-full relative transition-colors ${card[field] ? "bg-link" : "bg-border-soft"}`}
                          >
                            <span
                              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                              style={{ left: card[field] ? "22px" : "2px" }}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <section
                className="rounded-xl p-7 text-white"
                style={{ backgroundImage: "linear-gradient(135deg, #0B0B0B 0%, #2259BF 100%)" }}
              >
                <p className="num text-mint text-xs uppercase tracking-wide mb-2">Local Services</p>
                <h4 className="font-display font-semibold mb-2">Find a Nimbus ATM</h4>
                <p className="text-white/70 text-sm mb-4">Zero-fee withdrawals at partner locations.</p>
                <button
                  onClick={() => { setToast("ATM locator isn't built in the demo yet"); setTimeout(() => setToast(""), 2200); }}
                  className="num bg-white text-ink text-sm font-bold px-5 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <MapPin size={14} /> Locate Now
                </button>
              </section>
            </div>
          </div>
        )}
      </main>

      {modal === "order" && <OrderCardModal accounts={accounts} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />}
      {modal === "limit" && card && <AdjustLimitModal card={card} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />}
      {modal === "purchase" && card && <SimulatePurchaseModal card={card} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
      <MobileTabBar active="cards" />
    </div>
  );
}