/**
 * @format
 */

// Polyfills required by @solana/web3.js + MWA before any other import touches them.
// Kept always-on (harmless when USE_STUB=true) so flipping the MWA stub off later
// is a single-file edit. See src/wallet/MobileWalletAdapter.ts.
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
