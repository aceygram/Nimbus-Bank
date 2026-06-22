import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is on in your Supabase Auth settings, there's
    // no session yet — send them to login instead of the dashboard.
    if (data.session) {
      sessionStorage.removeItem("nimbus_session_started_at");
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-10">
          <span className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <span className="w-3 h-3 rounded-sm bg-mint" />
          </span>
          <span className="font-display font-semibold text-lg text-ink">Nimbus</span>
        </Link>

        <div className="bg-paper border border-line rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Open an account</h1>
          <p className="text-slate text-sm mt-1">Takes about a minute.</p>

          {error && (
            <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mt-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate">Full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Maya Chen"
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
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
                minLength={6}
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-ink font-semibold underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
