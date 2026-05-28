/* eslint-env jest */
import { anchorCannabisEvent, type TransactionSigner } from '../tx';
import { _testing, setTokens } from '../client';
import { config } from '../../config';

function fakeSigner(returnSigned = 'SIGNED_B64'): TransactionSigner & { calls: number } {
  const obj = { calls: 0 } as TransactionSigner & { calls: number };
  obj.signTransaction = jest.fn(async () => {
    obj.calls += 1;
    return returnSigned;
  });
  return obj;
}

describe('anchorCannabisEvent', () => {
  const originalFetch = globalThis.fetch;
  const originalUseStub = config.useStub;

  beforeEach(() => {
    config.useStub = false;
    _testing.reset();
    setTokens('access-1', 'refresh-1');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    config.useStub = originalUseStub;
  });

  it('builds tx → signs → submits and returns the canonical AnchorResult', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            event_id: 'evt-1',
            tx_bytes_b64: 'UNSIGNED_B64',
            payload_hash: 'phash',
            storage_uri: 'shdw://p',
            event_pda: 'PDA1',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            pda: 'PDA1',
            signature: 'SIG1',
            slot: 1234,
            explorer_url: 'https://solscan.io/tx/SIG1?cluster=devnet',
          }),
          { status: 200 },
        ),
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const signer = fakeSigner();
    const result = await anchorCannabisEvent(signer, {
      batchId: 'B'.repeat(26),
      eventType: 11,
      cultivarCode: 'HEM:CBD1',
      agentName: 'cultivator:42318911000104',
      payload: { evt: 'PACKAGED', schema_v: 1 },
    });

    expect(signer.calls).toBe(1);
    expect(result).toEqual({
      eventId: 'evt-1',
      eventPda: 'PDA1',
      signature: 'SIG1',
      explorerUrl: 'https://solscan.io/tx/SIG1?cluster=devnet',
      payloadHash: 'phash',
      storageUri: 'shdw://p',
    });

    // build body shape
    const buildBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(buildBody).toMatchObject({
      batch_id: 'B'.repeat(26),
      event_type: 11,
      cultivar_code: 'HEM:CBD1',
      agent_name: 'cultivator:42318911000104',
    });
    // submit body shape
    const submitBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(submitBody).toEqual({ event_id: 'evt-1', signed_tx_b64: 'SIGNED_B64' });
  });

  it('throws if build returns no tx bytes', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ event_id: 'x' }), { status: 200 }),
    ) as unknown as typeof fetch;
    await expect(
      anchorCannabisEvent(fakeSigner(), {
        batchId: 'B'.repeat(26),
        eventType: 1,
        cultivarCode: 'X',
        agentName: 'a',
        payload: {},
      }),
    ).rejects.toThrow(/not return a buildable tx/);
  });

  it('throws if submit returns no signature', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ event_id: 'e', tx_bytes_b64: 'U' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ pda: 'P' }), { status: 200 }),
      ) as unknown as typeof fetch;

    await expect(
      anchorCannabisEvent(fakeSigner(), {
        batchId: 'B'.repeat(26),
        eventType: 1,
        cultivarCode: 'X',
        agentName: 'a',
        payload: {},
      }),
    ).rejects.toThrow(/refusing to claim anchored/);
  });

  it('returns a stub AnchorResult when config.useStub=true (without hitting fetch)', async () => {
    config.useStub = true;
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const result = await anchorCannabisEvent(fakeSigner(), {
      batchId: 'B'.repeat(26),
      eventType: 11,
      cultivarCode: 'X',
      agentName: 'a',
      payload: {},
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.signature).toMatch(/.+/);
    expect(result.explorerUrl).toContain('solscan.io');
  });
});
