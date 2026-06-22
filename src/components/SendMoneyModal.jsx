import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SendMoneyModal({ fromAccount, onClose, onSuccess }) {
  const [step, setStep] = useState("form"); // 'form' -> 'confirm'
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [recipientName, setRecipientName] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  async function handleLookup() {
    setError("");
    setRecipientName(null);
    if (accountNumber.trim().length < 6) return;

    setChecking(true);
    const { data, error: lookupError } = await supabase
      .rpc("lookup_account", { p_account_number: accountNumber.trim() })
      .maybeSingle();
    setChecking(false);

    if (lookupError || !data) {
      setError("No account found with that number.");
      return;
    }
    setRecipientName(data.full_name);
  }

  function handleContinue(e) {
    e.preventDefault();
    setError("");
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!recipientName) {
      setError("Look up the recipient's account number first.");
      return;
    }
    setStep("confirm");
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }

    setSending(true);

    // Step-up re-auth: prove it's really you before any money moves,
    // independent of whatever session is already active.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (reauthError) {
      setSending(false);
      setError("That password isn't right.");
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("transfer_funds", {
      p_from_account_id: fromAccount.id,
      p_to_account_number: accountNumber.trim(),
      p_amount: parseFloat(amount),
      p_note: note || null,
    });
    setSending(false);

    if (rpcError) {
      setError(rpcError.message.replace(/^.*?:\s*/, ""));
      return;
    }

    onSuccess(data);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold text-lg text-ink">
            {step === "form" ? "Send money" : "Confirm transfer"}
          </h2>
          <button onClick={onClose} className="text-slate hover:text-ink text-sm">
            Close
          </button>
        </div>
        <p className="text-xs text-slate mb-5">
          From {fromAccount.account_type} ·{" "}
          <span className="num">{fromAccount.account_number}</span>
        </p>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        {step === "form" && (
          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate">Recipient account number</label>
              <input
                required
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setRecipientName(null);
                }}
                onBlur={handleLookup}
                placeholder="000000000000"
                className="num w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
              {checking && <p className="text-xs text-slate mt-1">Checking…</p>}
              {recipientName && (
                <p className="text-xs text-mint-deep font-medium mt-1">Sending to {recipientName}</p>
              )}
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
              <label className="text-xs font-medium text-slate">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's this for?"
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ink text-white font-semibold py-3 rounded-full hover:bg-mint-deep transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {step === "confirm" && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="bg-mist rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate">To</span>
                <span className="font-medium text-ink">{recipientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Account number</span>
                <span className="num text-ink">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Amount</span>
                <span className="num font-semibold text-ink">
                  ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {note && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate">Note</span>
                  <span className="text-ink">{note}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate">
                Enter your password to confirm
              </label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex-1 border border-line text-ink font-semibold py-3 rounded-full hover:bg-mist transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 bg-ink text-white font-semibold py-3 rounded-full hover:bg-mint-deep transition-colors disabled:opacity-60"
              >
                {sending ? "Sending…" : "Confirm & send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
