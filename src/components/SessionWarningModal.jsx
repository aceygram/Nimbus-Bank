export default function SessionWarningModal({ secondsLeft, onStay, onLogout }) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper rounded-2xl w-full max-w-sm p-6 text-center">
        <h2 className="font-display font-semibold text-lg text-ink">Still there?</h2>
        <p className="text-slate text-sm mt-2">
          For your security, you'll be logged out in{" "}
          <span className="num font-semibold text-ink">{secondsLeft}s</span> due to inactivity.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onLogout}
            className="flex-1 border border-line text-ink font-semibold py-2.5 rounded-full hover:bg-mist transition-colors"
          >
            Log out now
          </button>
          <button
            onClick={onStay}
            className="flex-1 bg-ink text-white font-semibold py-2.5 rounded-full hover:bg-mint-deep transition-colors"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
}
