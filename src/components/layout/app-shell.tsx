"use client";

import { SidebarProvider, useSidebar } from "./sidebar-context";
import Sidebar from "./sidebar";
import Header from "./header";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <Header />
        <main className="flex-1 px-6 lg:px-8 py-8">
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
