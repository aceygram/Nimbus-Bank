import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const TIMEOUT_MESSAGES = {
  idle: "You were logged out after a few minutes of inactivity, for your security.",
  absolute: "Your session expired and you've been logged out, for your security.",
  manual: "You've been logged out.",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutNotice = location.state?.reason ? TIMEOUT_MESSAGES[location.state.reason] : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-mist flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-10">
          <span className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <span className="w-3 h-3 rounded-sm bg-mint" />
          </span>
          <span className="font-display font-semibold text-lg text-ink">Nimbus</span>
        </Link>

        <div className="bg-paper border border-line rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Log in</h1>
          <p className="text-slate text-sm mt-1">Welcome back.</p>

          {timeoutNotice && (
            <p className="text-sm text-ink bg-mint/10 rounded-lg px-3 py-2 mt-4">{timeoutNotice}</p>
          )}

          {error && (
            <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mt-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-white font-semibold py-3 rounded-full hover:bg-mint-deep transition-colors disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate mt-6">
          New to Nimbus?{" "}
          <Link to="/signup" className="text-ink font-semibold underline underline-offset-4">
            Open an account
          </Link>
        </p>
      </div>
    </div>
  );
}
