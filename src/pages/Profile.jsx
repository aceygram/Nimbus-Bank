import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, HelpCircle, Pencil, Fingerprint, KeyRound, ShieldCheck, Camera } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import MobileTabBar from "../components/MobileTabBar";
import logoImg from '../assets/Nimbus-logo.png';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ full_name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [toast, setToast] = useState("");

  const loadProfile = useCallback(async (id) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone, address, is_admin")
      .eq("id", id)
      .single();
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setIsAdmin(profile.is_admin);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
      loadProfile(session.user.id).then(() => setLoading(false));
    });
  }, [navigate, loadProfile]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function startEditing() {
    setDraft({ full_name: fullName, phone, address });
    setEditing(true);
  }

  async function handleSaveDetails(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: draft.full_name, phone: draft.phone, address: draft.address })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      setToast("Couldn't save changes");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setFullName(draft.full_name);
    setPhone(draft.phone);
    setAddress(draft.address);
    setEditing(false);
    setToast("Details updated");
    setTimeout(() => setToast(""), 2000);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setToast("Password changed");
    setTimeout(() => setToast(""), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-dvh items-center justify-center text-slate text-sm">
        <img src={logoImg} alt="Nimbus Bank Logo" className="w-30 h-30 animate-pulse"/>
        <MobileTabBar active="profile" />
      </div>
    );
  }

  const initials = fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-dvh flex">
      <Sidebar
        fullName={fullName}
        isAdmin={isAdmin}
        active="profile"
        onTransferClick={() => navigate("/dashboard")}
        onLogout={handleLogout}
      />

      <main className="flex-1 px-5 sm:px-8 py-8 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Profile <span className="text-link">Settings</span></h1>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <Bell size={18} />
            </button>
            <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-slate hover:text-ink">
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        <div className="grid sm:grid-cols-[1.3fr_1fr] gap-5 mb-5">
          {/* PERSONAL DETAILS */}
          <div className="bg-paper border border-line rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-ink">Personal Details</h2>
              {!editing && (
                <button
                  onClick={startEditing}
                  className="num flex items-center gap-1.5 text-sm text-link"
                >
                  <Pencil size={14} /> Edit Details
                </button>
              )}
            </div>

            {!editing ? (
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="num text-xs text-label uppercase">Full Name</p>
                  <p className="text-ink font-medium mt-1">{fullName || "—"}</p>
                </div>
                <div>
                  <p className="num text-xs text-label uppercase">Email Address</p>
                  <p className="text-ink font-medium mt-1 break-all">{email}</p>
                </div>
                <div>
                  <p className="num text-xs text-label uppercase">Phone Number</p>
                  <p className="text-ink font-medium mt-1">{phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="num text-xs text-label uppercase">Residential Address</p>
                  <p className="text-ink font-medium mt-1">{address || "Not provided"}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div>
                  <label className="num text-xs text-label uppercase">Full Name</label>
                  <input
                    value={draft.full_name}
                    onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                </div>
                <div>
                  <label className="num text-xs text-label uppercase">Phone Number</label>
                  <input
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                </div>
                <div>
                  <label className="num text-xs text-label uppercase">Residential Address</label>
                  <input
                    value={draft.address}
                    onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                    placeholder="123 Main St, Springfield"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-border-soft bg-mist text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 border border-line text-ink font-medium py-2.5 rounded-lg hover:bg-mist transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-mint text-ink font-bold py-2.5 rounded-lg hover:bg-mint-deep transition-colors disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ACCOUNT TIER */}
          <div className="bg-ink rounded-2xl p-6 flex flex-col">
            <span className="num self-start bg-mint text-ink text-xs font-bold px-3 py-1 rounded-full mb-4">
              Current Tier
            </span>
            <h2 className="font-display text-3xl font-bold text-white">Premier</h2>
            <p className="text-white/60 text-sm mt-1 mb-5">Exclusively for Nimbus Bank VIPs</p>
            <ul className="space-y-2 text-sm text-white">
              {["Dedicated wealth advisor", "Zero foreign transaction fees", "Priority 24/7 support"].map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-mint shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* PROFILE PICTURE */}
          <div className="bg-paper border border-line rounded-2xl p-6">
            <h2 className="font-display font-semibold text-ink mb-5">Profile Picture</h2>
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <span className="w-24 h-24 rounded-full bg-blue flex items-center justify-center text-white font-display font-semibold text-2xl">
                  {initials}
                </span>
                <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-active border-2 border-paper flex items-center justify-center">
                  <Camera size={14} className="text-blue-active-text" />
                </span>
              </div>
              <p className="text-slate text-sm mt-4 max-w-xs">
                Photo upload isn't wired up in this demo — this avatar is generated from your name.
              </p>
              <button
                disabled
                className="mt-4 border border-line text-slate font-medium text-sm px-5 py-2 rounded-lg cursor-not-allowed"
              >
                Replace Photo
              </button>
            </div>
          </div>

          {/* SECURITY & ACCESS */}
          <div className="bg-paper border border-line rounded-2xl p-6">
            <h2 className="font-display font-semibold text-ink mb-5">Security &amp; Access</h2>

            {!changingPassword ? (
              <button
                onClick={() => setChangingPassword(true)}
                className="w-full flex items-center gap-4 bg-mist rounded-xl px-4 py-3.5 mb-3 hover:bg-muted transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-coral/10 text-coral flex items-center justify-center shrink-0">
                  <KeyRound size={16} />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-ink">Change Password</p>
                  <p className="num text-xs text-slate">Update your login password</p>
                </div>
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="bg-mist rounded-xl p-4 mb-3 space-y-3">
                {passwordError && (
                  <p className="text-xs text-coral bg-coral/10 rounded-lg px-3 py-2">{passwordError}</p>
                )}
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-soft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-soft bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mint"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordError("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1 border border-line text-ink text-sm font-medium py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="flex-1 bg-ink text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60"
                  >
                    {passwordSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center gap-4 bg-mist rounded-xl px-4 py-3.5 mb-3 opacity-60">
              <span className="w-9 h-9 rounded-lg bg-blue/10 text-blue flex items-center justify-center shrink-0">
                <Fingerprint size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Biometric Authentication</p>
                <p className="num text-xs text-slate">Not available in this demo</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-mist rounded-xl px-4 py-3.5 opacity-60">
              <span className="w-9 h-9 rounded-lg bg-mint/15 text-mint-deep flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Two-Factor Authentication</p>
                <p className="num text-xs text-slate">Not available in this demo</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <MobileTabBar active="profile" />
    </div>
  );
}
