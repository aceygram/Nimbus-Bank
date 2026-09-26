import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ShieldCheck, Mail } from "lucide-react";

// 2FA via Supabase email OTP — no QR code, no authenticator app needed.
// Flow: send OTP to the user's registered email → user enters 6-digit code →
//       on verify success, mark two_factor_enabled in their profile.
//
// NOTE: This enables the 2FA flag in the profile. To enforce it on login,
// you would add an OTP step in Login.jsx after signInWithPassword succeeds,
// checking two_factor_enabled before granting dashboard access.

export default function TwoFactorModal({ userId, userEmail, isEnabled, onClose, onSuccess }) {
  const [step, setStep] = useState(isEnabled ? "manage" : "intro"); 
  // intro → sending → verify → done | manage (when already enabled)
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode() {
    setError("");
    setLoading(true);

    // Send a 6-digit OTP to the user's registered email.
    // shouldCreateUser: false ensures we only work with existing accounts.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { shouldCreateUser: false },
    });

    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("verify");
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);

    // Verify the OTP. On success this also refreshes the user session.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: userEmail,
      token: code.trim(),
      type: "email",
    });

    if (verifyError) {
      setLoading(false);
      setError("Invalid or expired code. Try again.");
      return;
    }

    // Mark 2FA as enabled in the profile
    const flag = !isEnabled; // toggle
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ two_factor_enabled: flag })
      .eq("id", userId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStep("done");
    setTimeout(() => onSuccess(flag), 1200);
  }

  async function handleDisable() {
    setError("");
    setLoading(true);
    // To disable, re-verify identity with a fresh OTP then toggle flag
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (otpError) { setError(otpError.message); return; }
    setStep("verify");
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold text-lg text-ink">Two-Factor Authentication</h2>
          <button onClick={onClose} className="text-slate hover:text-ink text-sm">Close</button>
        </div>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mt-3">{error}</p>
        )}

        {step === "intro" && (
          <div className="mt-4">
            <div className="bg-muted rounded-xl p-5 flex items-start gap-4 mb-5">
              <span className="w-10 h-10 rounded-full bg-blue/10 text-blue flex items-center justify-center shrink-0">
                <Mail size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Email verification</p>
                <p className="text-xs text-slate mt-1">
                  We'll send a one-time 6-digit code to{" "}
                  <span className="font-medium text-ink">{userEmail}</span> to confirm it's you.
                </p>
              </div>
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-ink text-white font-bold py-3 rounded-xl hover:bg-mint-deep transition-colors disabled:opacity-60"
            >
              {loading ? "Sending code…" : "Send code to my email"}
            </button>
          </div>
        )}

        {step === "manage" && (
          <div className="mt-4">
            <div className="bg-mint/10 rounded-xl p-5 flex items-center gap-3 mb-5">
              <ShieldCheck size={20} className="text-mint-deep shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">2FA is active</p>
                <p className="text-xs text-slate mt-0.5">Your account has an extra layer of protection.</p>
              </div>
            </div>
            <button
              onClick={handleDisable}
              disabled={loading}
              className="w-full border border-coral text-coral font-bold py-3 rounded-xl hover:bg-coral/5 transition-colors disabled:opacity-60"
            >
              {loading ? "Sending code…" : "Disable 2FA"}
            </button>
          </div>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyCode} className="mt-4 space-y-4">
            <p className="text-sm text-slate">
              A 6-digit code was sent to <span className="font-medium text-ink">{userEmail}</span>. Enter it below.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="num w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 rounded-xl border border-border-soft bg-mist focus:outline-none focus:ring-2 focus:ring-mint"
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-ink text-white font-bold py-3 rounded-xl hover:bg-mint-deep transition-colors disabled:opacity-60"
            >
              {loading ? "Verifying…" : isEnabled ? "Confirm & Disable 2FA" : "Confirm & Enable 2FA"}
            </button>
            <button type="button" onClick={() => setStep(isEnabled ? "manage" : "intro")} className="w-full text-slate text-sm">
              ← Back
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="mt-6 text-center py-4">
            <ShieldCheck size={40} className="text-mint-deep mx-auto mb-3" />
            <p className="font-display font-semibold text-ink">
              {isEnabled ? "2FA disabled" : "2FA enabled"}
            </p>
            <p className="text-slate text-sm mt-1">
              {isEnabled ? "Your account no longer requires a second step." : "Your account is now protected by a second step."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}