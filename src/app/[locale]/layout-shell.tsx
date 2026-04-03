"use client";

import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import AppShell from "@/components/layout/app-shell";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isLoading, isAuthenticated } = useAuth();

    // Show a full-screen loader while auth state is being hydrated
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1623]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // On the login page, render children without AppShell
    if (pathname === "/login") {
        return <>{children}</>;
    }

    // For all other routes, require auth and show the AppShell
    if (!isAuthenticated) {
        // Auth context will handle redirect — show nothing while redirecting
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f1623]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <AppShell>{children}</AppShell>;
}
