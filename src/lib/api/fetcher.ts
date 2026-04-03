import { TOKEN_KEY } from "@/lib/auth/auth-context";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://loan-ui-production.up.railway.app/api";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetcher<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
  } catch (e) {
    const error = new Error("Network error");
    (error as any).status = 0;
    (error as any).info = null;
    throw error;
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("loanflow_user");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    const error = new Error("API request failed");
    (error as any).status = res.status;
    (error as any).info = await res.json().catch(() => null);
    throw error;
  }
  return res.json().catch(() => null as unknown as T);
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    });
  } catch (e) {
    const error = new Error("Network error");
    (error as any).status = 0;
    (error as any).info = null;
    throw error;
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("loanflow_user");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    const error = new Error("API request failed");
    (error as any).status = res.status;
    (error as any).info = await res.json().catch(() => null);
    throw error;
  }
  return res.json().catch(() => null as unknown as T);
}

// ── API client ─────────────────────────────────────────

export const api = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return fetcher<T>(buildUrl(path, params));
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body: JSON.stringify(body) });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};
