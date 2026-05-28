import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { ExternalLink, Fingerprint } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import type { ProofOfExistence } from '../types/passport';
import { truncateSignature } from '../wallet/MobileWalletAdapter';

interface Props {
  proof: ProofOfExistence;
}

function fmtClusterLabel(c: ProofOfExistence['network']) {
  if (c === 'mainnet-beta') return 'Solana Mainnet';
  if (c === 'devnet') return 'Solana Devnet';
  return 'Solana Testnet';
}

function fmtTimestamp(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * The cryptographic-receipt footer. Intentionally darker than the rest of the
 * passport so it reads as a separate, technical artifact — the "blockchain
 * receipt" you'd attach to a paper certificate.
 *
 * Everything here is verifiable: the user can recompute payloadSha256, fetch
 * payloadUri from Shadow Drive, and resolve the PDA against the program id.
 */
export function ProofOfExistenceCard({ proof }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Fingerprint size={18} color={colors.brand500} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Proof of Existence</Text>
          <Text style={styles.title}>Anchored on {fmtClusterLabel(proof.network)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Field label="Transaction Signature" value={truncateSignature(proof.txSignature)} mono />
      <Field label="Program Account (PDA)" value={truncateSignature(proof.pda, 6, 6)} mono />
      <Field label="Program ID" value={truncateSignature(proof.programId, 6, 6)} mono />
      <Field label="Slot" value={proof.slot.toLocaleString('en-US')} />
      <Field label="Confirmed At" value={fmtTimestamp(proof.blockTime)} />
      <Field label="Payload SHA-256" value={`${proof.payloadSha256.slice(0, 18)}…`} mono />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View transaction on Solana Explorer"
        onPress={() => Linking.openURL(proof.explorerUrl)}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <ExternalLink size={16} color={colors.textInverse} strokeWidth={2.2} />
        <Text style={styles.ctaText}>View on Solana Explorer</Text>
      </Pressable>

      <Text style={styles.fineprint}>
        Signed natively via Seed Vault on Solana Seeker. Payload stored
        immutably on Shadow Drive; hash anchored on Solana via the compliance
        registry program.
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, mono && styles.fieldValueMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand900,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(20,184,166,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.caption,
    color: colors.brand500,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    fontSize: 16,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: spacing.sm,
  },

  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  fieldLabel: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  fieldValue: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    fontSize: 13,
  },
  fieldValueMono: {
    ...typography.mono,
    color: colors.textInverse,
    fontSize: 12,
  },

  cta: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand500,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
  },
  ctaText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    fontSize: 14,
  },
  fineprint: {
    ...typography.body,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});
