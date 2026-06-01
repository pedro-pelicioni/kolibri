const BASE = import.meta.env.VITE_API_BASE_URL;

const ACCESS_KEY = "kolibri_access";
const REFRESH_KEY = "kolibri_refresh";

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_KEY);

export function setTokens(access: string, refresh?: string) {
  accessToken = access;
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) {
    refreshToken = refresh;
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasSession(): boolean {
  return !!accessToken;
}

async function refreshAccess(): Promise<boolean> {
  if (!refreshToken) return false;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const { accessToken: na } = (await res.json()) as { accessToken: string };
  setTokens(na);
  return true;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  // só declara JSON quando há corpo — Fastify rejeita body vazio com content-type json
  if (init.body !== undefined && !(init.body instanceof FormData)) {
    headers["content-type"] = "application/json";
  }
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && retry && (await refreshAccess())) {
    return request<T>(path, init, false);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
};

export { BASE as API_BASE };
