import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Snowflake, Sun, PiggyBank } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import AdjustBalanceModal from "../components/AdjustBalanceModal";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [toast, setToast] = useState("");

  const loadData = useCallback(async () => {
    const { data: accountRows } = await supabase
      .from("accounts")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    setAccounts(accountRows || []);

    const { data: txRows } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    setTransactions(txRows || []);
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (!profile?.is_admin) {
        setAuthChecked(true);
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
      setAuthChecked(true);
      loadData();
    }
    checkAdmin();
  }, [navigate, loadData]);

  async function handleToggleFreeze(account) {
    const { error } = await supabase.rpc("admin_set_frozen", {
      p_account_id: account.id,
      p_frozen: !account.frozen,
    });
    if (!error) {
      setToast(account.frozen ? "Account unfrozen" : "Account frozen");
      setTimeout(() => setToast(""), 2000);
      loadData();
    }
  }

  function handleAdjustSuccess() {
    setAdjustTarget(null);
    setToast("Balance updated");
    setTimeout(() => setToast(""), 2000);
    loadData();
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center text-slate text-sm">
        Checking access…
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Not authorized</h1>
          <p className="text-slate text-sm mt-2 max-w-sm">
            This account doesn't have admin access.
          </p>
          <Link to="/dashboard" className="text-mint-deep font-semibold text-sm mt-4 inline-block">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist px-5 sm:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="num text-xs font-semibold text-mint-deep tracking-widest">NIMBUS ADMIN</p>
            <h1 className="font-display text-2xl font-semibold text-ink mt-1">All accounts</h1>
          </div>
          <Link to="/dashboard" className="text-sm font-medium text-slate hover:text-ink">
            ← Back to my dashboard
          </Link>
        </header>

        {/* SUMMARY */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-paper border border-line rounded-2xl p-5">
            <p className="text-xs text-slate">Total accounts</p>
            <p className="num text-2xl font-semibold text-ink mt-1">{accounts.length}</p>
          </div>
          <div className="bg-paper border border-line rounded-2xl p-5">
            <p className="text-xs text-slate">Total balance</p>
            <p className="num text-2xl font-semibold text-ink mt-1">
              ${accounts.reduce((sum, a) => sum + Number(a.balance), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-paper border border-line rounded-2xl p-5">
            <p className="text-xs text-slate">Frozen accounts</p>
            <p className="num text-2xl font-semibold text-coral mt-1">
              {accounts.filter((a) => a.frozen).length}
            </p>
          </div>
        </div>

        {/* ACCOUNTS TABLE */}
        <section className="bg-paper border border-line rounded-2xl overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mist text-slate text-xs">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Account number</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-right px-5 py-3 font-medium">Balance</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{a.profiles?.full_name}</p>
                      <p className="text-xs text-slate">{a.profiles?.email}</p>
                    </td>
                    <td className="num px-5 py-3 text-ink">{a.account_number}</td>
                    <td className="px-5 py-3 capitalize text-ink">{a.account_type}</td>
                    <td className="num px-5 py-3 text-right font-semibold text-ink">
                      ${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3">
                      {a.frozen ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-coral bg-coral/10 px-2.5 py-1 rounded-full">
                          <Snowflake size={12} /> Frozen
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-mint-deep bg-mint/10 px-2.5 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAdjustTarget(a)}
                          title="Adjust balance"
                          className="p-2 rounded-lg border border-line hover:border-mint text-ink"
                        >
                          <PiggyBank size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleFreeze(a)}
                          title={a.frozen ? "Unfreeze" : "Freeze"}
                          className="p-2 rounded-lg border border-line hover:border-mint text-ink"
                        >
                          {a.frozen ? <Sun size={15} /> : <Snowflake size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* GLOBAL LEDGER */}
        <section>
          <h2 className="font-display font-semibold text-sm text-ink mb-3">Global transaction feed</h2>
          <div className="bg-paper border border-line rounded-2xl divide-y divide-line">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm text-ink">
                    <span className="font-medium">{tx.from_name || "—"}</span>
                    <span className="text-slate"> → </span>
                    <span className="font-medium">{tx.to_name || "—"}</span>
                  </p>
                  <p className="text-xs text-slate mt-0.5 capitalize">
                    {tx.type} · {new Date(tx.created_at).toLocaleString()}
                    {tx.note ? ` · ${tx.note}` : ""}
                  </p>
                </div>
                <span className="num text-sm font-semibold text-ink">
                  ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {adjustTarget && (
        <AdjustBalanceModal
          account={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
