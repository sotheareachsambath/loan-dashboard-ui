"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useRole } from "@/lib/hooks/use-role";
import type { UserRole } from "@/lib/types";

interface NavItem {
  key: string;
  href: string;
  translationKey: string;
  icon: React.ReactNode;
  minRole?: UserRole[];
}

const navItems: NavItem[] = [
  {
    key: "dashboard",
    href: "/",
    translationKey: "nav.dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  // {
  //   key: "users",
  //   href: "/users",
  //   translationKey: "nav.users",
  //   minRole: ["ADMIN", "DIRECTOR", "MANAGER"],
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  //       <circle cx="9" cy="7" r="4" />
  //       <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  //     </svg>
  //   ),
  // },
  {
    key: "loan-products",
    href: "/loan-products",
    translationKey: "nav.loanProducts",
    minRole: ["ADMIN", "DIRECTOR", "MANAGER"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    key: "loan-applications",
    href: "/loan-applications",
    translationKey: "nav.loanApplications",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    key: "disbursements",
    href: "/disbursements",
    translationKey: "nav.disbursements",
    minRole: ["ADMIN", "DIRECTOR", "MANAGER", "LOAN_OFFICER", "TELLER"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    key: "repayments",
    href: "/repayments",
    translationKey: "nav.repayments",
    minRole: ["ADMIN", "DIRECTOR", "MANAGER", "LOAN_OFFICER", "TELLER"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const { collapsed, isMobileOpen, toggleMobile } = useSidebar();
  const { user, logout } = useAuth();
  const { role } = useRole();

  // Filter nav items based on role
  const visibleItems = navItems.filter((item) => {
    if (!item.minRole) return true; // visible to everyone
    return item.minRole.includes(role);
  });

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
    : "User";

  const displayEmail = user?.email ?? "";

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-[#0f1623] flex flex-col transition-all duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0 w-[260px] shadow-2xl shadow-black/50" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
      `}
    >
      {/* Logo area */}
      <div className={`flex items-center gap-3 h-16 border-b border-white/[0.06] ${collapsed ? "justify-center px-0" : "px-6"}`}>
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[13px] font-semibold text-white leading-none whitespace-nowrap">LoanFlow</p>
            <p className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">
              <span className="hidden sm:inline">Management System</span>
              <span className="sm:hidden">LMS</span>
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase text-gray-500">
            Menu
          </p>
        )}
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobileOpen) toggleMobile();
                  }}
                  title={collapsed ? t(item.translationKey) : undefined}
                  className={`group flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 ${collapsed ? "lg:justify-center lg:px-0 px-3 py-2.5" : "gap-3 px-3 py-2.5"
                    } ${active
                      ? "bg-white/[0.08] text-white shadow-sm shadow-black/10"
                      : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
                    }`}
                >
                  <span
                    className={`flex-shrink-0 transition-colors duration-150 ${active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-400"
                      }`}
                  >
                    {item.icon}
                  </span>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
                    {t(item.translationKey)}
                  </span>
                  {active && (
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50 ${collapsed ? "lg:hidden" : ""}`} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center lg:px-0 px-2" : "px-2"}`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg shadow-blue-500/20">
            {initials}
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-[12px] font-medium text-gray-200 truncate">{displayName}</p>
            <p className="text-[10px] text-gray-500 truncate">{displayEmail}</p>
          </div>
          <button
            onClick={logout}
            title={t("login.signOut")}
            className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-white/[0.06] hover:text-red-400 transition-colors duration-150 cursor-pointer ${collapsed ? "lg:hidden" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
        <button
          onClick={logout}
          title={t("login.signOut")}
          className={`mt-3 w-full items-center justify-center py-2 rounded-lg text-gray-500 hover:bg-white/[0.06] hover:text-red-400 transition-colors duration-150 cursor-pointer hidden ${collapsed ? "lg:flex" : ""}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
