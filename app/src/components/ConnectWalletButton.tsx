import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Wallet, ChevronRight, CheckCircle2 } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import {
  connectWallet,
  truncateSignature,
  type WalletSession,
} from '../wallet/MobileWalletAdapter';

interface Props {
  /** Cluster the connect call should authorise against */
  cluster?: 'mainnet-beta' | 'devnet' | 'testnet';
  /** Bubble up the session so a parent can drive routing / SIWS */
  onConnected?: (session: WalletSession) => void;
}

/**
 * Big primary "Connect Wallet" CTA used on the Scanner/Home screen.
 *
 * Three visual states:
 *   1. idle      — "Connect Wallet" (brand fill)
 *   2. connecting — spinner + "Opening Seed Vault…"
 *   3. connected  — green outline + truncated pubkey
 *
 * On a real Seeker tapping this opens Seed Vault for biometric approval.
 */
export function ConnectWalletButton({ cluster = 'devnet', onConnected }: Props) {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePress() {
    if (session || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const s = await connectWallet(cluster);
      setSession(s);
      onConnected?.(s);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <View style={[styles.btn, styles.btnConnected]}>
        <CheckCircle2 size={18} color={colors.green600} strokeWidth={2.2} />
        <View style={{ flex: 1 }}>
          <Text style={styles.connectedLabel}>{session.walletName}</Text>
          <Text style={styles.connectedKey}>
            {truncateSignature(session.publicKey, 6, 6)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Connect wallet via Solana Mobile Wallet Adapter"
        disabled={busy}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.btn,
          styles.btnIdle,
          pressed && { opacity: 0.85 },
        ]}
      >
        {busy ? (
          <>
            <ActivityIndicator size="small" color={colors.textInverse} />
            <Text style={styles.label}>Opening Seed Vault…</Text>
          </>
        ) : (
          <>
            <Wallet size={18} color={colors.textInverse} strokeWidth={2.2} />
            <Text style={styles.label}>Connect Wallet</Text>
            <ChevronRight size={18} color={colors.textInverse} strokeWidth={2.2} />
          </>
        )}
      </Pressable>
      {err && <Text style={styles.error}>{err}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  btnIdle: {
    backgroundColor: colors.brand900,
  },
  btnConnected: {
    backgroundColor: colors.green50,
    borderWidth: 1,
    borderColor: colors.green500,
    justifyContent: 'flex-start',
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    fontSize: 15,
    flex: 0,
  },
  connectedLabel: {
    ...typography.caption,
    color: colors.green600,
    fontSize: 10,
  },
  connectedKey: {
    ...typography.mono,
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
  error: {
    ...typography.body,
    color: colors.red500,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
