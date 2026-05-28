/* eslint-env jest */
import { loginWithSIWS, type WalletSigner } from '../siws';
import { _testing } from '../client';
import { config } from '../../config';

jest.mock('@react-native-async-storage/async-storage', () => ({
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

function makeFakeSigner(): WalletSigner & { calls: { authorize: number; sign: number } } {
  const calls = { authorize: 0, sign: 0 };
  return {
    calls,
    authorize: jest.fn(async () => {
      calls.authorize += 1;
      return { publicKey: 'PK_TEST', walletName: 'TestWallet', authToken: 'AT_TEST' };
    }),
    signMessage: jest.fn(async () => {
      calls.sign += 1;
      return 'BASE64_SIG==';
    }),
  } as WalletSigner & { calls: { authorize: number; sign: number } };
}

describe('loginWithSIWS', () => {
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

  it('runs challenge → sign → verify and stores tokens', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: 'Sign this!', nonce: 'NONCE-1', pubkey: 'PK_TEST' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'JWT-A',
            refresh_token: 'JWT-R',
            tenant_id: 'T1',
            role: 'cultivator',
            agent_name: 'cultivator:demo',
            expires_in: 900,
          }),
          { status: 200 },
        ),
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const signer = makeFakeSigner();
    const result = await loginWithSIWS(signer, { cluster: 'devnet', role: 'cultivator' });

    expect(signer.calls.authorize).toBe(1);
    expect(signer.calls.sign).toBe(1);
    expect(result.accessToken).toBe('JWT-A');
    expect(result.refreshToken).toBe('JWT-R');
    expect(result.pubkey).toBe('PK_TEST');
    expect(result.role).toBe('cultivator');

    // Verify call body: pubkey + nonce + signature + role
    const verifyBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(verifyBody).toMatchObject({
      pubkey: 'PK_TEST',
      nonce: 'NONCE-1',
      signature: 'BASE64_SIG==',
      role: 'cultivator',
    });
  });

  it('throws if challenge is malformed', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: '' }), { status: 200 }),
    ) as unknown as typeof fetch;

    const signer = makeFakeSigner();
    await expect(loginWithSIWS(signer)).rejects.toThrow(/malformed SIWS challenge/);
    expect(signer.calls.sign).toBe(0); // never asked the wallet to sign garbage
  });

  it('throws if verify returns no tokens', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'm', nonce: 'n' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      ) as unknown as typeof fetch;

    await expect(loginWithSIWS(makeFakeSigner())).rejects.toThrow(/did not issue tokens/);
  });
});
