import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import { QrCode, Nfc, ScanLine } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { ConnectWalletButton } from '../components/ConnectWalletButton';

interface Props {
  /** Fires when the user successfully scans a code; in the demo we wire it to
   *  whatever route ("open the passport") the App.tsx switcher exposes. */
  onScanned?: (batchId: string) => void;
}

/**
 * Minimal entry / home screen.
 *
 * Visual centerpiece is the viewfinder cutout; in production we mount
 * react-native-vision-camera here. For the demo we simulate a scan with the
 * "Demo: open passport" pressable so judges can see the next screen instantly.
 *
 * NFC: the Seeker has a real NFC chip — dispensaries can tap packaging
 * instead of scanning. We expose the same `onScanned` callback for both.
 */
export function ScannerScreen({ onScanned }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Top brand strip */}
      <View style={styles.header}>
        <Text style={styles.brand}>Kolibri</Text>
        <Text style={styles.subBrand}>Seed-to-Sale · Solana Seeker</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Verify Product</Text>
        <Text style={styles.title}>
          Scan QR code or tap an NFC-tagged package
        </Text>
        <Text style={styles.lede}>
          Every Kolibri-certified product carries a digital plant passport
          anchored on Solana. Verify authenticity in under two seconds.
        </Text>

        {/* Viewfinder placeholder — replace with VisionCamera on-device */}
        <View style={styles.viewfinderWrap}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <ScanLine size={40} color={colors.brand500} strokeWidth={1.5} />
            <Text style={styles.viewfinderHint}>
              Camera viewfinder mounts here
            </Text>
          </View>
          {/* Demo affordance — fires onScanned with the mock batch id */}
          <Pressable
            onPress={() => onScanned?.('01HXYZ4K9V8A2BWMQ3DPRTNS6F')}
            style={({ pressed }) => [
              styles.demoTap,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Demo: open mock passport"
          >
            <Text style={styles.demoTapText}>Demo · open mock passport</Text>
          </Pressable>
        </View>

        <View style={styles.methodsRow}>
          <Method icon={QrCode} label="QR Code" />
          <Method icon={Nfc} label="NFC Tap" />
        </View>
      </View>

      {/* Footer — wallet CTA */}
      <View style={styles.footer}>
        <ConnectWalletButton cluster="devnet" />
        <Text style={styles.footerHint}>
          Signing happens natively via Seed Vault — no key ever leaves your
          device.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Method({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <View style={styles.method}>
      <Icon size={18} color={colors.textSecondary} strokeWidth={2} />
      <Text style={styles.methodLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  brand: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 20,
  },
  subBrand: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  body: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.brand700,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  lede: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  viewfinderWrap: { marginTop: spacing.md },
  viewfinder: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.brand500,
  },
  cornerTL: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  viewfinderHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  demoTap: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  demoTapText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  methodsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  methodLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  footerHint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
