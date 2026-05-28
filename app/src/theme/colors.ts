// Kolibri design tokens — corporate / clinical / Minespider-style.
// Goal: a high-end pharma compliance tool, not a "weed app".
// Whites and slate grays do the heavy lifting; clinical green is reserved
// strictly for verification/positive state so it carries semantic weight.

export const colors = {
  // Surfaces
  bg: '#FFFFFF',
  bgMuted: '#F7F8FA',   // page background
  surface: '#FFFFFF',   // cards
  surfaceAlt: '#F1F5F9',// subtle cards (slate-100)

  // Borders / dividers
  border: '#E2E8F0',    // slate-200
  borderStrong: '#CBD5E1', // slate-300

  // Typography
  textPrimary: '#0F172A',   // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#94A3B8',     // slate-400
  textInverse: '#FFFFFF',

  // Clinical green — verification, on-chain proof
  green600: '#16A34A',
  green500: '#22C55E',
  green100: '#DCFCE7',
  green50:  '#F0FDF4',

  // Brand teal — Kolibri accent, used sparingly (PoE card, primary CTA)
  brand900: '#134E4A',
  brand700: '#0F766E',
  brand500: '#14B8A6',

  // Status (kept muted on purpose — this is compliance UI, not a dashboard)
  amber500: '#F59E0B',
  red500:   '#EF4444',
  blue500:  '#3B82F6',
} as const;

export type ColorKey = keyof typeof colors;
