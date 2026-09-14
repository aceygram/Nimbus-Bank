import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import logoImg from '../assets/Nimbus-logo.png'; 

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

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

    if (data.session) {
      sessionStorage.removeItem("nimbus_session_started_at");
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-22 flex items-center justify-between px-6 bg-mist/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="Nimbus Bank Logo" className="w-18 h-18 object-cover hover:scale-105 transition-transform duration-300"/>
        </Link>
        <Link to="/login" className="num text-sm text-link">
        Support
        <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 stroke-current">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-10 max-w-5xl w-full items-center">
          {/* LEFT — marketing panel, hidden on small screens */}
          <div className="hidden lg:block">
            <div className="aspect-[4/3] rounded-xl border border-line shadow-xl overflow-hidden relative bg-ink">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 30% 20%, rgba(93,139,244,0.35), transparent 60%), radial-gradient(circle at 80% 80%, rgba(160,212,104,0.25), transparent 60%)",
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ink to-transparent">
                <h2 className="font-display text-2xl font-semibold text-white">Secure Your Future</h2>
                <p className="text-white/80 text-sm mt-2">
                  Join over 2 million members building their wealth with Nimbus Premier
                  tools and institutional security.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-muted border border-line rounded-lg p-5 flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-blue flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-white" />
                </span>
                <div>
                  <p className="num text-sm font-medium text-ink">FDIC Insured</p>
                  <p className="num text-xs text-slate">Up to $250,000</p>
                </div>
              </div>
              <div className="bg-muted border border-line rounded-lg p-5 flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-mint flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="text-ink" />
                </span>
                <div>
                  <p className="num text-sm font-medium text-ink">4.50% APY</p>
                  <p className="num text-xs text-slate">Savings growth</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="bg-paper border border-line rounded-xl shadow-lg p-8">
            <h1 className="font-display text-3xl font-semibold text-ink">Create Account</h1>
            <p className="text-slate mt-2 mb-6">
              Complete the form below to get started with Nimbus Premier banking.
            </p>

            {error && (
              <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="num text-sm text-slate">Full Name</label>
                <div className="relative mt-1">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-3.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                </div>
              </div>

              <div>
                <label className="num text-sm text-slate">Email Address</label>
                <div className="relative mt-1">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full pl-10 pr-4 py-3.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                </div>
              </div>

              <div>
                <label className="num text-sm text-slate">Create Password</label>
                <div className="relative mt-1">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="num text-xs text-slate mt-1">Min. 8 characters, 1 number, and 1 symbol.</p>
              </div>

              <label className="flex items-start gap-3 text-sm text-slate">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded border-border-soft"
                />
                <span>
                  I agree to the <span className="text-link">Terms of Service</span> and{" "}
                  <span className="text-link">Privacy Policy</span>.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mint text-ink font-bold py-4 rounded-lg hover:bg-mint-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? "Creating account…" : "Get Started"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="border-t border-line mt-6 pt-5 text-center">
              <span className="text-slate text-sm">Already have an account? </span>
              <Link to="/login" className="text-link text-sm">Log In</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-ink px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white font-display font-bold">Nimbus Bank</p>
          <div className="flex gap-4 num text-xs text-white/60">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
            <span>Contact Us</span>
          </div>
        </div>
        <p className="num text-white/40 text-xs mt-4 max-w-5xl mx-auto">
          © 2024 Nimbus Bank. Member FDIC. Equal Housing Lender.
        </p>
      </footer>
    </div>
  );
}
