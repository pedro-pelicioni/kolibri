// HTTP client tipado pro kolibri-gateway.
//
// Responsabilidades:
//   1. Anexar `Authorization: Bearer <jwt>` em todo request
//   2. Detectar 401 → chamar /auth/refresh uma única vez → retry
//   3. Surfacing de ApiError com status code + body pra a UI
//   4. Stub mode: se config.useStub=true, lança erro claro (cada api/*.ts
//      handler decide se serve mock antes de chamar o client)

import { config } from '../config';

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Lock pra não disparar 2 refreshes em paralelo. */
let refreshing: Promise<boolean> | null = null;

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: string,
  ) {
    super(`${path} → ${status}: ${body.slice(0, 200)}`);
    this.name = 'ApiError';
  }

  /** True quando o gateway sinalizou que o token expirou e refresh falhou. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Pula refresh+retry — usado por /auth/* e pelo próprio retry. */
  noAuthRetry?: boolean;
}

export async function api<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  if (config.useStub) {
    throw new ApiError(0, path, 'config.useStub=true — use mock data instead of api()');
  }

  const url = `${config.gatewayBaseUrl}${path}`;
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(accessToken && !opts.headers?.authorization
        ? { authorization: `Bearer ${accessToken}` }
        : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  };

  const res = await fetch(url, init);

  if (res.status === 401 && !opts.noAuthRetry && refreshToken && !path.startsWith('/auth/')) {
    const ok = await runRefresh();
    if (ok) return api<T>(path, { ...opts, noAuthRetry: true });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, path, text);
  }

  // Some endpoints (e.g. /upload/photo) return JSON; some (DELETE) return empty.
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function runRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${config.gatewayBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { access_token?: string; refresh_token?: string };
      if (!data.access_token) return false;
      accessToken = data.access_token;
      if (data.refresh_token) refreshToken = data.refresh_token;
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Wrapper de FormData (upload/photo) — segue a mesma política de auth+retry. */
export async function apiUpload<T = unknown>(
  path: string,
  body: FormData,
  headers: Record<string, string> = {},
): Promise<T> {
  if (config.useStub) {
    throw new ApiError(0, path, 'config.useStub=true — upload mocked elsewhere');
  }

  const res = await fetch(`${config.gatewayBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body,
  });
  if (res.status === 401 && refreshToken) {
    const ok = await runRefresh();
    if (ok) return apiUpload<T>(path, body, headers);
  }
  if (!res.ok) {
    throw new ApiError(res.status, path, await res.text().catch(() => ''));
  }
  return (await res.json()) as T;
}

/** Exposto pros testes — não usar em código de produção. */
export const _testing = {
  reset() {
    accessToken = null;
    refreshToken = null;
    refreshing = null;
  },
  getRefreshToken: () => refreshToken,
};
