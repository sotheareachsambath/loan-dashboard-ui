"use client";

import { SidebarProvider, useSidebar } from "./sidebar-context";
import Sidebar from "./sidebar";
import Header from "./header";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobileOpen, toggleMobile } = useSidebar();

  return (
    <>
      <Sidebar />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#0f1623]/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={toggleMobile}
        />
      )}

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ml-0 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
          }`}
      >
        <Header />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw]">
          {children}
        </main>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  );
}
