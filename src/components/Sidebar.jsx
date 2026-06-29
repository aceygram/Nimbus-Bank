import { Link } from "react-router-dom";
import { LayoutDashboard, Wallet, CreditCard, Receipt, Grid2x2, Settings, HelpCircle, LogOut } from "lucide-react";

const NAV_ITEMS = [
  ["Dashboard", LayoutDashboard, "/dashboard", "dashboard"],
  ["Accounts", Wallet, "/accounts", "accounts"],
  ["Cards", CreditCard, "/cards", "cards"],
  ["Bills", Receipt, "/bills", "bills"],
  ["More", Grid2x2, "/more", "more"],
  ["Settings", Settings, "/profile", "profile"],
];

export default function Sidebar({ fullName, isAdmin, active, onTransferClick, onLogout }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-muted border-r border-line px-4 py-6 shrink-0">
      <div className="flex items-center gap-3 px-2 pb-6 mb-2">
        <span className="w-10 h-10 rounded-full bg-blue flex items-center justify-center text-white font-display font-semibold text-sm shrink-0">
          {fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="num text-sm font-medium text-link">Welcome back</p>
          <p className="num text-xs text-slate">Nimbus Premier Member</p>
        </div>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map(([label, Icon, to, key]) => (
          <Link
            key={label}
            to={to}
            className={`num w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
              active === key ? "bg-blue-active text-blue-active-text" : "text-slate hover:bg-paper"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {isAdmin && (
        <Link
          to="/admin"
          className="num mt-2 px-4 py-3 rounded-lg text-sm text-link hover:bg-paper transition-colors"
        >
          Admin dashboard →
        </Link>
      )}

      <button
        onClick={onTransferClick}
        className="mt-6 bg-mint text-ink font-bold py-3 rounded-xl hover:bg-mint-deep transition-colors"
      >
        Transfer Funds
      </button>

      <div className="mt-auto pt-6 border-t border-line space-y-1">
        <button className="num w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate hover:bg-paper transition-colors">
          <HelpCircle size={18} /> Help Center
        </button>
        <button
          onClick={onLogout}
          className="num w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-coral hover:bg-paper transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}