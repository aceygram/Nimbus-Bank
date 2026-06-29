import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ShieldCheck, BadgeCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const TIMEOUT_MESSAGES = {
  idle: "You were logged out after a few minutes of inactivity, for your security.",
  absolute: "Your session expired and you've been logged out, for your security.",
  manual: "You've been logged out.",
  password_reset: "Your password was updated. Log in with your new password.",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutNotice = location.state?.reason ? TIMEOUT_MESSAGES[location.state.reason] : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    sessionStorage.removeItem("nimbus_session_started_at");
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-20 flex items-center justify-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-lg bg-ink flex items-center justify-center">
            <span className="w-3 h-3 rounded-sm bg-mint" />
          </span>
          <span className="font-display font-semibold text-lg text-ink">Nimbus Bank</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-ink">Welcome Back</h1>
            <p className="text-slate mt-2">Enter your credentials to access your premier account.</p>
          </div>

          <div className="bg-paper border border-line rounded-xl shadow-lg p-8">
            {timeoutNotice && (
              <p className="text-sm text-ink bg-mint/10 rounded-lg px-3 py-2 mb-4">{timeoutNotice}</p>
            )}
            {error && (
              <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or Username"
                className="w-full px-4 py-3.5 rounded-lg border border-border-soft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3.5 rounded-lg border border-border-soft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="num flex items-center gap-2 text-sm text-slate">
                  <input type="checkbox" className="rounded border-border-soft" />
                  Remember Me
                </label>
                <Link to="/recover-password" className="num text-sm text-link font-medium">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mint text-ink font-bold py-4 rounded-lg hover:bg-mint-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? "Logging in…" : "Log In"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="border-t border-line mt-8 pt-6 text-center">
              <span className="text-slate text-sm">Don't have an account? </span>
              <Link to="/signup" className="text-link text-sm">Create an Account</Link>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-6 opacity-60">
            <span className="num flex items-center gap-1.5 text-xs text-slate uppercase tracking-wide">
              <ShieldCheck size={14} /> Secure 256-bit SSL
            </span>
            <span className="num flex items-center gap-1.5 text-xs text-slate uppercase tracking-wide">
              <BadgeCheck size={14} /> Member FDIC
            </span>
          </div>
        </div>
      </main>

      <footer className="bg-mist border-t border-line px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="num text-xs text-slate">© 2024 Nimbus Bank. Member FDIC. Equal Housing Lender.</p>
          <div className="flex gap-4 num text-xs text-slate">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
            <span>Contact Us</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
