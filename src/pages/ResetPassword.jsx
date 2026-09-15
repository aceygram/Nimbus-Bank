import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Clicking the email link logs the browser into a temporary recovery
    // session and fires this event — that's our signal the form below is
    // safe to show. Without this, a stale/expired link would just dump
    // someone onto a password form with no actual session behind it.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Also check immediately in case the event already fired before we
    // mounted (Supabase processes the recovery token from the URL on load).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    navigate("/login", { state: { reason: "password_reset" } });
  }

  return (
    <div className="min-h-dvhx-col">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <span className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center">
                <span className="w-3 h-3 rounded-sm bg-mint" />
              </span>
              <span className="font-display font-semibold text-ink">Nimbus Bank</span>
            </Link>
            <h1 className="font-display text-2xl font-semibold text-ink">Set a new password</h1>
          </div>

          <div className="bg-paper border border-line rounded-xl shadow-lg p-8">
            {!ready ? (
              <p className="text-slate text-sm text-center py-4">
                Verifying your reset link…
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">{error}</p>
                )}
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full pl-10 pr-11 py-3 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-mint text-ink font-bold py-3.5 rounded-lg hover:bg-mint-deep transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
