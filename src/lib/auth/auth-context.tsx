"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { useRouter, usePathname } from "@/i18n/navigation";

// ── Types ──────────────────────────────────────────────

interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

// ── Constants ──────────────────────────────────────────

const TOKEN_KEY = "loanflow_token";
const USER_KEY = "loanflow_user";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://loan-ui-production.up.railway.app/api";

// ── Context ────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: () => { },
});

// ── Provider ───────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Hydrate from localStorage, then verify with /api/auth/me
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);

        if (!storedToken) {
            setIsLoading(false);
            return;
        }

        // Set token immediately so UI can render while we verify
        setToken(storedToken);

        // Try loading cached user first for fast render
        try {
            const storedUser = localStorage.getItem(USER_KEY);
            if (storedUser) setUser(JSON.parse(storedUser));
        } catch {
            // ignore bad cache
        }

        // Verify token & fetch fresh user data from /api/auth/me
        fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Invalid session");
                const freshUser: AuthUser = await res.json();
                setUser(freshUser);
                localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
            })
            .catch(() => {
                // Token is invalid/expired — clear everything
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setToken(null);
                setUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    // Redirect to login when not authenticated (after hydration)
    useEffect(() => {
        if (!isLoading && !token && pathname !== "/login") {
            router.replace("/login");
        }
    }, [isLoading, token, pathname, router]);

    const login = useCallback(
        async (email: string, password: string) => {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(
                    body?.message || "Invalid email or password"
                );
            }

            const data = await res.json();

            // Adapt to common API response shapes
            const accessToken: string =
                data.access_token || data.accessToken || data.token;
            const userData: AuthUser = data.user ?? {
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
            };

            if (!accessToken) {
                throw new Error("No token received from server");
            }

            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));

            setToken(accessToken);
            setUser(userData);

            router.replace("/");
        },
        [router]
    );

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        router.replace("/login");
    }, [router]);

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            logout,
        }),
        [user, token, isLoading, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

// ── Hook ───────────────────────────────────────────────

export function useAuth() {
    return useContext(AuthContext);
}

export { TOKEN_KEY };
