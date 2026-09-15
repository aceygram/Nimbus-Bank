import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  FolderLock,
  Gift,
  Lock,
  Headset,
  Bell,
  HelpCircle,
  ShieldHalf,
  Award,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import logoImg from '../assets/Nimbus-logo.png'; 

export default function More() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState("");

  const loadProfile = useCallback(async (id) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin")
      .eq("id", id)
      .single();
    if (profile) {
      setFullName(profile.full_name);
      setIsAdmin(profile.is_admin);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      loadProfile(session.user.id).then(() => setLoading(false));
    });
  }, [navigate, loadProfile]);

  function comingSoon() {
    setToast("This isn't built in the demo yet");
    setTimeout(() => setToast(""), 2200);
  }

  if (loading) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center text-slate text-sm">
        <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse"/>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex">
      <Sidebar
        fullName={fullName}
        isAdmin={isAdmin}
        active="more"
        onTransferClick={() => navigate("/dashboard")}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/"); }}
      />

      <main className="flex-1 px-5 sm:px-8 py-8 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <div className="invisible" />
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <Bell size={18} />
            </button>
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        <p className="font-display text-3xl font-semibold text-ink mb-2">Beyond Banking</p>
        <p className="text-slate text-lg max-w-2xl mb-8">
          Access your complete financial ecosystem. <span className="text-link">Manage your investments, secure your future, and handle taxes with Nimbus precision.</span>
          
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Tax Payments — wide */}
          <button
            onClick={comingSoon}
            className="text-left lg:col-span-2 bg-paper border border-line rounded-xl p-8 hover:border-slate transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-blue/15 flex items-center justify-center mb-3">
              <Landmark size={20} className="text-blue" />
            </span>
            <h3 className="text-ink mb-1">Tax Payments</h3>
            <p className="text-slate text-sm">
              Direct federal and state tax settlements with automatic compliance reporting.
            </p>
            <p className="num text-link text-sm mt-6">Manage Taxes →</p>
          </button>

          {/* Insurance */}
          <button
            onClick={comingSoon}
            className="text-left bg-paper border border-line rounded-xl p-8 hover:border-slate transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-muted-2 flex items-center justify-center mb-3">
              <ShieldCheck size={20} className="text-slate" />
            </span>
            <h3 className="text-ink mb-1">Insurance</h3>
            <p className="text-slate text-sm">Comprehensive protection for life, health, and property.</p>
            <p className="num text-blue text-xs mt-6 uppercase">View Policies ›</p>
          </button>

          {/* Investments */}
          <button
            onClick={comingSoon}
            className="text-left bg-paper border-l-4 border-link border-y border-r border-line rounded-xl p-8 hover:border-slate transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-muted-2 flex items-center justify-center mb-3">
              <TrendingUp size={20} className="text-slate" />
            </span>
            <h3 className="text-ink mb-1">Investments</h3>
            <p className="text-slate text-sm">Wealth management tools and real-time market insights.</p>
            <div className="flex items-center gap-3 mt-6">
              <span className="num text-xs bg-muted-2 text-slate px-2 py-1 rounded uppercase">Portfolio</span>
              <span className="num text-xs text-link font-bold">+12.4%</span>
            </div>
          </button>

          {/* Document Vault */}
          <button
            onClick={comingSoon}
            className="text-left bg-paper border border-line rounded-xl p-8 hover:border-slate transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-muted-2 flex items-center justify-center mb-3">
              <FolderLock size={20} className="text-slate" />
            </span>
            <h3 className="text-ink mb-1">Document Vault</h3>
            <p className="text-slate text-sm">Secure storage for e-statements, contracts, and IDs.</p>
          </button>

          {/* Rewards */}
          <button
            onClick={comingSoon}
            className="text-left sm:col-span-2 bg-ink rounded-xl p-8 hover:opacity-90 transition-opacity flex items-center gap-6"
          >
            <span className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Award size={22} className="text-mint" />
            </span>
            <div>
              <p className="num text-link text-xs uppercase tracking-widest mb-1">Loyalty Program</p>
              <h3 className="text-white mb-1">Rewards &amp; Perks</h3>
              <p className="text-white/60 text-sm">
                You have 45,200 points available. Redeem for travel, shopping, or cashback.
              </p>
            </div>
          </button>

          {/* Security — links to the real panel on Profile */}
          <Link
            to="/profile"
            className="bg-paper border border-line rounded-xl p-8 hover:border-slate transition-colors"
          >
            <span className="w-12 h-12 rounded-lg bg-muted-2 flex items-center justify-center mb-3">
              <ShieldHalf size={20} className="text-slate" />
            </span>
            <h3 className="text-ink mb-1">Security</h3>
            <p className="text-slate text-sm">Manage biometrics, 2FA, and trusted devices.</p>
          </Link>

          {/* Support */}
          <button
            onClick={comingSoon}
            className="text-left bg-ink rounded-xl p-8 hover:opacity-90 transition-opacity"
          >
            <span className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-3">
              <Headset size={20} className="text-white" />
            </span>
            <h3 className="text-white mb-1">Support</h3>
            <p className="text-white/70 text-sm mb-4">24/7 dedicated assistance for your premium needs.</p>
            <p className="num text-white text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint" /> Live agents online
            </p>
          </button>
        </div>

        <section className="grid sm:grid-cols-3 gap-6 mt-10 items-center">
          <div className="sm:col-span-2">
            <h3 className="text-ink mb-2">Secure by Design</h3>
            <p className="text-slate text-sm">
              Your data is protected by bank-grade AES-256 encryption. Our document vault and
              security hub ensure that your secondary services are as protected as your main accounts.
            </p>
            <div className="flex gap-3 mt-4">
              <span className="num inline-flex items-center gap-1.5 bg-muted-2 text-ink text-sm px-4 py-2 rounded-full">
                <Lock size={14} /> End-to-end Encrypted
              </span>
              <span className="num inline-flex items-center gap-1.5 bg-muted-2 text-ink text-sm px-4 py-2 rounded-full">
                <ShieldCheck size={14} /> Certified Security
              </span>
            </div>
          </div>
          <div className="h-48 rounded-xl bg-ink" />
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}