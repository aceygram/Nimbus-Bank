import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <span className="w-3 h-3 rounded-sm bg-mint" />
          </span>
          <span className="font-display font-semibold text-lg tracking-tight text-ink">
            Nimbus
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate">
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#how" className="hover:text-ink transition-colors">How it works</a>
          <a href="#trust" className="hover:text-ink transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-ink px-4 py-2 hover:text-mint-deep transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-full hover:bg-mint-deep transition-colors"
          >
            Open account
          </Link>
        </div>
      </nav>
    </header>
  );
}
