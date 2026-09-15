import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Headset } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import logoImg from '../assets/Nimbus-logo.png'; 


export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    // Show success either way — confirming or denying that an email exists
    // for a given address is exactly the kind of thing that helps an
    // attacker enumerate accounts, so Supabase (and we) stay quiet about it.
    if (resetError && resetError.status && resetError.status >= 500) {
      setError("Something went wrong. Please try again in a moment.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-dvhex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src={logoImg} alt="Nimbus Bank Logo" className="w-25 h-25 mt-12 object-cover hover:scale-105 transition-transform duration-300"/>
            </Link>
            <h1 className="font-display text-2xl font-semibold text-ink">Recover Password</h1>
            <p className="text-slate mt-2 text-sm">
              Enter the email address associated with your Nimbus Bank account.
            </p>
          </div>

          <div className="bg-paper border border-line rounded-xl shadow-lg p-8">
            {sent ? (
              <div className="text-center py-4">
                <p className="text-ink font-medium">Check your inbox</p>
                <p className="text-slate text-sm mt-2">
                  If an account exists for <span className="text-ink">{email}</span>, a reset
                  link is on its way.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">{error}</p>
                )}
                <div>
                  <label className="num text-xs text-label uppercase">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue text-white font-bold py-3.5 rounded-lg hover:bg-link transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            )}

            <div className="border-t border-line mt-6 pt-5 text-center">
              <Link to="/login" className="text-sm text-link">← Back to Login</Link>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-6 opacity-60">
            <span className="num flex items-center gap-1.5 text-xs text-slate uppercase tracking-wide">
              <Lock size={14} /> Encrypted
            </span>
            <span className="num flex items-center gap-1.5 text-xs text-slate uppercase tracking-wide">
              <Headset size={14} /> 24/7 Help
            </span>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center">
        <p className="num text-xs text-slate">© 2024 Nimbus Bank. Member FDIC.</p>
      </footer>
    </div>
  );
}
