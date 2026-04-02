"use client";

import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/locale-switcher";
import { useSidebar } from "./sidebar-context";

export default function Header() {
  const t = useTranslations();
  const { toggle, collapsed } = useSidebar();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="flex items-center justify-between h-full px-6 lg:px-8">
        {/* Left: Toggle + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150 cursor-pointer"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            )}
          </button>
          <h1 className="text-[15px] font-semibold text-gray-900">
            {t("common.appName")}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search button */}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100/80 text-gray-400 text-[13px] hover:bg-gray-100 transition-colors duration-150 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="hidden sm:inline">{t("common.search")}...</span>
          </button>

          {/* Notification bell */}
          <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150 cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Locale switcher */}
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
