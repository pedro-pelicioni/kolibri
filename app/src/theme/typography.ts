import { Platform, TextStyle } from 'react-native';

// Modern clean sans-serif. System default already looks corporate;
// swap to 'Inter' once react-native-vector-icons / custom font is wired.
const family = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
}) as string;

const familyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
}) as string;

const familyMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

export const typography = {
  // Page title — strain name on the passport
  h1: {
    fontFamily: familyMedium,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  } as TextStyle,
  h2: {
    fontFamily: familyMedium,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,
  h3: {
    fontFamily: familyMedium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,
  // Body
  body: {
    fontFamily: family,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  } as TextStyle,
  bodyStrong: {
    fontFamily: familyMedium,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  } as TextStyle,
  // Small labels — used for "BATCH ID", "CBD %", etc. — ALL CAPS, tracked out.
  caption: {
    fontFamily: family,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
  // Data value — large number on lab cards
  numeric: {
    fontFamily: familyMedium,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,
  // Tx signatures, addresses — keep them monospace so they read as crypto
  mono: {
    fontFamily: familyMono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  } as TextStyle,
};
