import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-mist/80 backdrop-blur-sm border-b border-line">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <span className="w-3 h-3 rounded-sm bg-mint" />
          </span>
          <span className="font-display font-bold text-lg text-ink">Nimbus Bank</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="num text-sm text-slate hover:text-ink transition-colors">Accounts</a>
          <a href="#how" className="num text-sm text-slate hover:text-ink transition-colors">Payments</a>
          <a href="#trust" className="num text-sm text-slate hover:text-ink transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="num text-sm text-slate hover:text-ink transition-colors hidden sm:inline">
            Support
          </Link>
          <Link
            to="/login"
            className="num text-sm bg-ink text-white px-4 py-2 rounded-lg hover:bg-mint-deep transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
