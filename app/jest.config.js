module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // RN navigation embute PNGs (e.g. back-icon) que o jest não parseia.
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  // Transformar pacotes RN/Solana ESM (.mjs) — caso contrário smoke test
  // App.test.tsx explode ao requerer MobileWalletAdapter.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@solana|@solana-mobile)/)',
  ],
};
