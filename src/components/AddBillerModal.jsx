import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const CATEGORIES = ["utilities", "rent", "subscription", "insurance", "other"];

export default function AddBillerModal({ userId, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("utilities");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [autopay, setAutopay] = useState(false);
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
    if (!dueDate) {
      setError("Pick a due date.");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("billers").insert({
      user_id: userId,
      name,
      category,
      amount: numericAmount,
      due_date: dueDate,
      autopay,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-lg text-ink">Add New Biller</h2>
          <button onClick={onClose} className="text-slate hover:text-ink text-sm">Close</button>
        </div>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="num text-xs text-label uppercase">Biller Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City Water District"
              className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>
          <div>
            <label className="num text-xs text-label uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="num text-xs text-label uppercase">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="num w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            <div>
              <label className="num text-xs text-label uppercase">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="num w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate">
            <input
              type="checkbox"
              checked={autopay}
              onChange={(e) => setAutopay(e.target.checked)}
              className="rounded border-border-soft"
            />
            Enable autopay for this biller
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-mint text-ink font-bold py-3 rounded-lg hover:bg-mint-deep transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add Biller"}
          </button>
        </form>
      </div>
    </div>
  );
}