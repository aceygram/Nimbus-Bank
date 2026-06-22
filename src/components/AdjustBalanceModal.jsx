import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdjustBalanceModal({ account, onClose, onSuccess }) {
  const [direction, setDirection] = useState("credit"); // 'credit' | 'debit'
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setSaving(true);
    const signedAmount = direction === "credit" ? numericAmount : -numericAmount;
    const { error: rpcError } = await supabase.rpc("admin_adjust_balance", {
      p_account_id: account.id,
      p_amount: signedAmount,
      p_note: note || null,
    });
    setSaving(false);

    if (rpcError) {
      setError(rpcError.message.replace(/^.*?:\s*/, ""));
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold text-lg text-ink">Adjust balance</h2>
          <button onClick={onClose} className="text-slate hover:text-ink text-sm">
            Close
          </button>
        </div>
        <p className="text-xs text-slate mb-5">
          {account.profiles?.full_name} · <span className="num">{account.account_number}</span>
        </p>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("credit")}
              className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                direction === "credit" ? "bg-mint-deep text-white border-mint-deep" : "border-line text-ink"
              }`}
            >
              Credit (add)
            </button>
            <button
              type="button"
              onClick={() => setDirection("debit")}
              className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                direction === "debit" ? "bg-coral text-white border-coral" : "border-line text-ink"
              }`}
            >
              Debit (remove)
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="num w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate">Reason (logged on the ledger)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Demo top-up"
              className="w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ink text-white font-semibold py-3 rounded-full hover:bg-mint-deep transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : `${direction === "credit" ? "Add" : "Remove"} funds`}
          </button>
        </form>
      </div>
    </div>
  );
}
