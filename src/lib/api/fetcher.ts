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
  } catch {
    const error = new Error("Network error") as Error & { status?: number; info?: unknown };
    error.status = 0;
    error.info = null;
    throw error;
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("loanflow_user");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    const error = new Error("API request failed") as Error & { status?: number; info?: unknown };
    error.status = res.status;
    error.info = await res.json().catch(() => null);
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
  } catch {
    const error = new Error("Network error") as Error & { status?: number; info?: unknown };
    error.status = 0;
    error.info = null;
    throw error;
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("loanflow_user");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    const error = new Error("API request failed") as Error & { status?: number; info?: unknown };
    error.status = res.status;
    error.info = await res.json().catch(() => null);
    throw error;
  }
  return res.json().catch(() => null as unknown as T);
}

async function requestForm<T>(
  path: string,
  body: FormData,
  options?: Omit<RequestInit, "body">
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        ...getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
      body,
    });
  } catch {
    const error = new Error("Network error") as Error & { status?: number; info?: unknown };
    error.status = 0;
    error.info = null;
    throw error;
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("loanflow_user");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    const error = new Error("API request failed") as Error & { status?: number; info?: unknown };
    error.status = res.status;
    error.info = await res.json().catch(() => null);
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
  postForm<T>(path: string, body: FormData): Promise<T> {
    return requestForm<T>(path, body, { method: "POST" });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};
