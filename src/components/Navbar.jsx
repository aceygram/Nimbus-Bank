import { Link } from "react-router-dom";
import logoImg from '../assets/Nimbus-logo.png';

export default function Navbar() {
  return (
    // fixed: stays at the top as the hero/page scrolls behind it.
    // bg-mist/95 + backdrop-blur: content is slightly visible through
    // the bar which looks polished while still being readable.
    <header className="fixed top-0 left-0 right-0 z-40 bg-mist/95 backdrop-blur-sm border-b border-line">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="Nimbus Bank Logo" className="h-18 w-auto" />
        </Link>

        <div className="hidden md:flex items-center ml-25 gap-6">
          <a href="#features" className="num text-sm text-slate hover:text-ink transition-colors">Accounts</a>
          <a href="#how" className="num text-sm text-slate hover:text-ink transition-colors">Payments</a>
          <a href="#trust" className="num text-sm text-slate hover:text-ink transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="num text-sm text-slate hover:text-ink transition-colors hidden sm:inline">
            Support
          </Link>
          <Link to="/login" className="num text-sm bg-ink text-white px-4 py-2 rounded-lg hover:bg-mint-deep transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}