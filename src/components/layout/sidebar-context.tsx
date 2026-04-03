"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => { },
  isMobileOpen: false,
  toggleMobile: () => { },
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggle = useCallback(() => setCollapsed((prev) => !prev), []);
  const toggleMobile = useCallback(() => setIsMobileOpen((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, isMobileOpen, toggleMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
