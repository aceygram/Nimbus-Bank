import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Fingerprint, ShieldCheck, AlertTriangle } from "lucide-react";

// Biometric via WebAuthn — uses the device's platform authenticator
// (fingerprint, Face ID, Windows Hello, PIN) through the browser's
// Credential Management API. No third-party library needed.
//
// Security note: the challenge here is generated client-side and the
// assertion signature is NOT cryptographically verified server-side
// (that would require a Supabase Edge Function or custom backend acting
// as the Relying Party). What IS real: the device biometric is genuinely
// prompted, the credential is created/used by the OS, and the credential
// ID is stored in the user's profile. For a portfolio demo this gives the
// full UX without a custom RP backend.

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export default function BiometricModal({ userId, userEmail, fullName, isEnabled, credentialId, onClose, onSuccess }) {
  const [supported, setSupported] = useState(null); // null = checking
  const [step, setStep] = useState(isEnabled ? "manage" : "intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSupport() {
      if (!window.PublicKeyCredential) {
        setSupported(false);
        return;
      }
      try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setSupported(available);
      } catch {
        setSupported(false);
      }
    }
    checkSupport();
  }, []);

  async function handleRegister() {
    setError("");
    setLoading(true);

    try {
      // Create a WebAuthn credential — triggers device biometric / PIN prompt
      const credential = await navigator.credentials.create({
        publicKey: {
          rp: {
            name: "Nimbus Bank",
            id: window.location.hostname,
          },
          user: {
            // userId must be a BufferSource — encode the Supabase UUID
            id: new TextEncoder().encode(userId),
            name: userEmail,
            displayName: fullName,
          },
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },   // ES256
            { type: "public-key", alg: -257 },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // built-in device authenticator only
            userVerification: "required",         // must pass biometric or PIN
            residentKey: "preferred",
          },
          timeout: 60000,
        },
      });

      // Store the base64-encoded rawId so we can reference this credential later
      const b64Id = toBase64(credential.rawId);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ biometric_enabled: true, biometric_credential_id: b64Id })
        .eq("id", userId);

      if (updateError) throw new Error(updateError.message);
      setStep("done_enable");
      setTimeout(() => onSuccess(true, b64Id), 1200);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Biometric prompt was dismissed or denied. Please try again.");
      } else if (err.name === "InvalidStateError") {
        setError("A credential for this device is already registered.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    // Trigger device biometric to confirm identity before disabling
    setError("");
    setLoading(true);

    try {
      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: credentialId
            ? [{ id: fromBase64(credentialId), type: "public-key" }]
            : [],
          userVerification: "required",
          timeout: 60000,
        },
      });

      // Biometric passed — disable in profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ biometric_enabled: false, biometric_credential_id: null })
        .eq("id", userId);

      if (updateError) throw new Error(updateError.message);
      setStep("done_disable");
      setTimeout(() => onSuccess(false, null), 1200);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Biometric check was dismissed. Please try again.");
      } else {
        setError(err.message || "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold text-lg text-ink">Biometric Authentication</h2>
          <button onClick={onClose} className="text-slate hover:text-ink text-sm">Close</button>
        </div>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mt-3">{error}</p>
        )}

        {/* Checking support */}
        {supported === null && (
          <p className="text-slate text-sm mt-4 text-center">Checking device support…</p>
        )}

        {/* Not supported */}
        {supported === false && (
          <div className="mt-4 bg-coral/10 rounded-xl p-5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-coral shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink">Not supported</p>
              <p className="text-xs text-slate mt-1">
                Your device or browser doesn't support platform biometric authentication.
                Try Chrome or Safari on a device with fingerprint or Face ID.
              </p>
            </div>
          </div>
        )}

        {supported && step === "intro" && (
          <div className="mt-4">
            <div className="bg-muted rounded-xl p-5 flex items-start gap-4 mb-5">
              <span className="w-10 h-10 rounded-full bg-blue/10 text-blue flex items-center justify-center shrink-0">
                <Fingerprint size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Use your device biometric</p>
                <p className="text-xs text-slate mt-1">
                  Register your fingerprint, Face ID, or Windows Hello PIN to secure your account.
                  Your browser will prompt for biometric confirmation now.
                </p>
              </div>
            </div>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-ink text-white font-bold py-3 rounded-xl hover:bg-mint-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Fingerprint size={18} />
              {loading ? "Waiting for device…" : "Register biometric"}
            </button>
          </div>
        )}

        {supported && step === "manage" && (
          <div className="mt-4">
            <div className="bg-mint/10 rounded-xl p-5 flex items-center gap-3 mb-5">
              <ShieldCheck size={20} className="text-mint-deep shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">Biometric is active</p>
                <p className="text-xs text-slate mt-0.5">Your device biometric is registered and protecting your account.</p>
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full border border-coral text-coral font-bold py-3 rounded-xl hover:bg-coral/5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Fingerprint size={18} />
              {loading ? "Waiting for device…" : "Disable biometric"}
            </button>
          </div>
        )}

        {(step === "done_enable" || step === "done_disable") && (
          <div className="mt-6 text-center py-4">
            <ShieldCheck size={40} className="text-mint-deep mx-auto mb-3" />
            <p className="font-display font-semibold text-ink">
              {step === "done_enable" ? "Biometric registered!" : "Biometric disabled"}
            </p>
            <p className="text-slate text-sm mt-1">
              {step === "done_enable"
                ? "Your device biometric is now linked to your account."
                : "Biometric authentication has been removed."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}