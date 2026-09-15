import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Flag, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import logoImg from '../assets/Nimbus-logo.png'; 

const TYPE_LABEL = {
  transfer: "Transfer",
  bill: "Bill payment",
  adjustment: "Account adjustment",
  card_purchase: "Card purchase",
  exchange: "Currency exchange",
  deposit: "Deposit",
};

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOutgoing, setIsOutgoing] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: txRow } = await supabase.from("transactions").select("*").eq("id", id).single();
      if (!txRow) {
        setLoading(false);
        return;
      }
      setTx(txRow);

      const { data: userAccounts } = await supabase.from("accounts").select("*").eq("user_id", session.user.id);
      const outgoing = (userAccounts || []).some((a) => a.id === txRow.from_account_id);
      setIsOutgoing(outgoing);
      const relevantAccount = (userAccounts || []).find(
        (a) => a.id === (outgoing ? txRow.from_account_id : txRow.to_account_id)
      );
      setAccount(relevantAccount || null);
      setLoading(false);
    }
    load();
  }, [id, navigate]);

  function handleDownloadReceipt() {
    const lines = [
      "NIMBUS BANK — TRANSACTION RECEIPT",
      "----------------------------------------",
      `Transaction ID: ${tx.id}`,
      `Date: ${new Date(tx.created_at).toLocaleString()}`,
      `Type: ${TYPE_LABEL[tx.type] || tx.type}`,
      `From: ${tx.from_name || "—"}`,
      `To: ${tx.to_name || "—"}`,
      `Amount: $${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      tx.note ? `Note: ${tx.note}` : null,
      "----------------------------------------",
      "This is a demo receipt generated for portfolio purposes.",
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nimbus-receipt-${tx.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showComingSoon() {
    setToast("This isn't built in the demo yet");
    setTimeout(() => setToast(""), 2200);
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-slate text-sm">
      <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse"/>
    </div>;
  }

  if (!tx) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-slate text-sm">Transaction not found.</p>
        <Link to="/dashboard" className="text-link text-sm font-medium">Back to dashboard</Link>
      </div>
    );
  }

  const counterpart = isOutgoing ? tx.to_name : tx.from_name;
  const signedAmount = isOutgoing ? -tx.amount : tx.amount;

  return (
    <div className="min-h-dvh bg-mist px-5 sm:px-10 py-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="num flex items-center gap-1.5 text-sm text-slate hover:text-ink mb-6">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="bg-paper border border-line rounded-xl p-7 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">{counterpart || "Unknown"}</h1>
                <span className="num text-xs font-bold text-mint-deep bg-mint/15 px-3 py-1 rounded-full uppercase">
                  Completed
                </span>
              </div>
              <p className="text-slate text-sm">{new Date(tx.created_at).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}</p>
            </div>
            <p className={`num text-3xl sm:text-4xl font-bold ${signedAmount < 0 ? "text-ink" : "text-mint-deep"}`}>
              {signedAmount < 0 ? "−" : "+"}${Math.abs(signedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2 bg-paper border border-line rounded-xl p-7">
            <h2 className="text-ink border-b border-line pb-4 mb-4">Transaction Details</h2>
            <div className="space-y-4">
              <Row label="Type" value={TYPE_LABEL[tx.type] || tx.type} />
              {tx.note && <Row label="Category / Note" value={tx.note} accent />}
              {account && (
                <Row label="Account" value={`${account.account_type[0].toUpperCase()}${account.account_type.slice(1)} **** ${account.account_number.slice(-4)}`} />
              )}
              <Row label="Transaction ID" value={tx.id} mono />
            </div>

            <div className="flex flex-wrap gap-3 mt-7">
              <button onClick={handleDownloadReceipt} className="num flex items-center gap-2 bg-ink text-white text-sm font-bold px-5 py-3 rounded-xl">
                <Download size={15} /> Download Receipt
              </button>
              <button onClick={showComingSoon} className="num flex items-center gap-2 bg-paper border border-line text-coral text-sm font-bold px-5 py-3 rounded-xl">
                <Flag size={15} /> Report an Issue
              </button>
            </div>
          </div>

          <div
            className="rounded-xl p-7 text-white flex flex-col gap-3"
            style={{ backgroundImage: "linear-gradient(135deg, #0B0B0B 0%, #2259BF 100%)" }}
          >
            <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ShieldCheck size={18} className="text-mint" />
            </span>
            <h3 className="font-display font-semibold">Transaction Secure</h3>
            <p className="text-white/70 text-sm">
              This transaction was processed through Nimbus's encrypted transfer pipeline and
              logged immutably to your account ledger.
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate text-sm">{label}</span>
      <span className={`text-sm font-medium ${mono ? "num text-slate" : accent ? "text-link font-bold" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}