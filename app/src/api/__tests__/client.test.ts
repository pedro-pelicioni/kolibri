/* eslint-env jest */
import { api, setTokens, clearTokens, ApiError, _testing } from '../client';
import { config } from '../../config';

const REAL_BASE = 'https://dpo2u.com/kolibri';

describe('api client', () => {
  const originalFetch = globalThis.fetch;
  const originalUseStub = config.useStub;

  beforeEach(() => {
    config.useStub = false;
    _testing.reset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    config.useStub = originalUseStub;
  });

  it('throws ApiError when config.useStub=true', async () => {
    config.useStub = true;
    await expect(api('/anything')).rejects.toBeInstanceOf(ApiError);
  });

  it('attaches Bearer token + content-type and hits the configured base URL', async () => {
    setTokens('access-1', 'refresh-1');
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const out = await api<{ ok: boolean }>('/batches');
    expect(out).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${REAL_BASE}/batches`);
    expect(init.method).toBe('GET');
    expect(init.headers['content-type']).toBe('application/json');
    expect(init.headers.authorization).toBe('Bearer access-1');
  });

  it('serialises body as JSON for POST', async () => {
    setTokens('access-1', 'refresh-1');
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ x: 1 }), { status: 200 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await api('/auth/siws/challenge', { method: 'POST', body: { pubkey: 'PK1' } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ pubkey: 'PK1' }));
  });

  it('attempts /auth/refresh exactly once on 401 then retries', async () => {
    setTokens('expired', 'refresh-good');
    const fetchMock = jest
      .fn()
      // First call: protected route → 401
      .mockResolvedValueOnce(new Response('expired', { status: 401 }))
      // Refresh call: returns new access token
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'fresh', refresh_token: 'refresh-good' }), { status: 200 }),
      )
      // Retry: succeeds
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const out = await api<{ ok: boolean }>('/batches');
    expect(out).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe(`${REAL_BASE}/auth/refresh`);
    // Retry used the new access token
    const retryHeaders = fetchMock.mock.calls[2][1].headers;
    expect(retryHeaders.authorization).toBe('Bearer fresh');
  });

  it('throws ApiError with status + body on non-OK', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response('bad input', { status: 400 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(api('/batches')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      path: '/batches',
    });
  });

  it('skips refresh+retry for /auth/* paths', async () => {
    setTokens('any', 'refresh');
    const fetchMock = jest.fn().mockResolvedValue(new Response('nope', { status: 401 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      api('/auth/siws/verify', { method: 'POST', body: { pubkey: 'P' } }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clearTokens drops auth header on next call', async () => {
    setTokens('a', 'r');
    clearTokens();
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await api('/health');
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBeUndefined();
  });
});
