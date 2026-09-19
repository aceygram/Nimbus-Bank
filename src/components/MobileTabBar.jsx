import { memo } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Wallet, CreditCard, Settings, ReceiptText } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", key: "dashboard" },
  { label: "Accounts", icon: Wallet, to: "/accounts", key: "accounts" },
  { label: "Cards", icon: CreditCard, to: "/cards", key: "cards" },
  { label: "Bills", icon: ReceiptText, to: "/bills", key: "bills" },
  { label: "Settings", icon: Settings, to: "/profile", key: "profile" },
];

const MobileTabBar = memo(function MobileTabBar({ active }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur-sm border-t border-line flex justify-around items-end z-50"
      style={{
        transform: "translateZ(0)",           // Force GPU layer — prevents subpixel jump
        willChange: "transform",             // Hint browser to keep layer stable
        paddingBottom: "max(12px, env(safe-area-inset-bottom))", // Stable safe-area handling
        height: "calc(64px + env(safe-area-inset-bottom))",      // Fixed height, never shifts
      }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, to, key }) => {
        const isActive = active === key;

        return (
          <Link
            key={label}
            to={to}
            className="relative pt-3 flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-colors duration-150 select-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {/* Active indicator — absolutely positioned so it NEVER affects layout flow
            <span
              className={`absolute top-1 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-200 ${
                isActive ? "w-1 opacity-100" : "w-0 opacity-0"
              }`}
              style={{ backgroundColor: "var(--color-blue-active, #3b82f6)" }}
            /> */}

            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
              className={`shrink-0 transition-colors duration-150 ${
                isActive ? "text-blue-active" : "text-slate"
              }`}
            />

            <span
              className={`text-[10px] font-medium leading-none transition-colors duration-150 ${
                isActive ? "text-blue-active" : "text-slate"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
});

export default MobileTabBar;