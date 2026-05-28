/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock o wallet adapter pra não puxar @solana/web3.js (ESM .mjs que o jest
// não transpila por padrão) durante o smoke test. Os módulos reais são
// exercitados pelos tests dedicados em src/api/__tests__/.
jest.mock('../src/wallet/MobileWalletAdapter', () => ({
  USE_STUB: true,
  connectWallet: jest.fn(),
  signMessageWithWallet: jest.fn(),
  signAndSubmitEvent: jest.fn(),
  getWalletSigner: () => ({
    authorize: jest.fn(),
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
  }),
  truncateSignature: (sig: string) => sig,
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
