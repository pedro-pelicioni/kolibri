import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import {
  Sprout,
  FlaskConical,
  Truck,
  Building2,
  Scissors,
  ExternalLink,
  Check,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import type { TimelineEvent } from '../types/passport';
import { truncateSignature } from '../wallet/MobileWalletAdapter';

interface Props {
  events: TimelineEvent[];
  /** Solana cluster the events were anchored on — drives the explorer URL */
  cluster: 'mainnet-beta' | 'devnet' | 'testnet';
}

// Map the canonical 15-event taxonomy to a small icon + actor color.
// We collapse them to 4 "lanes" for visual rhythm (farm, lab, transport, dispensary).
function iconFor(code: TimelineEvent['code']) {
  switch (code) {
    case 'SEED_PLANTED':
    case 'MOTHER_REGISTERED':
    case 'CLONE_CUT':
    case 'VEGETATION_START':
    case 'FLOWERING_START':
      return Sprout;
    case 'HARVEST':
    case 'DRYING_START':
    case 'CURING_START':
      return Scissors;
    case 'LAB_SAMPLE_TAKEN':
    case 'LAB_RESULT_RELEASED':
      return FlaskConical;
    case 'TRANSFERRED':
    case 'PACKAGED':
      return Truck;
    case 'DISPENSED':
      return Building2;
    default:
      return Sprout;
  }
}

function formatTimestamp(iso: string): string {
  // Brazilian dispensary audience — pt-BR locale, 24h clock, day/month/year.
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function explorerUrl(sig: string, cluster: Props['cluster']) {
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://solscan.io/tx/${sig}${suffix}`;
}

/**
 * The Minespider-style vertical stepper. Each event is one row:
 *   [icon column with rail] [content card]
 *
 * Last row hides its bottom rail so the line terminates at the final step.
 */
export function TraceabilityTimeline({ events, cluster }: Props) {
  return (
    <View>
      {events.map((evt, idx) => {
        const Icon = iconFor(evt.code);
        const isLast = idx === events.length - 1;
        return (
          <View key={evt.id} style={styles.row}>
            {/* Left rail + node */}
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  evt.verified ? styles.nodeVerified : styles.nodePending,
                ]}
              >
                <Icon
                  size={16}
                  color={evt.verified ? colors.green600 : colors.textMuted}
                  strokeWidth={2.2}
                />
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>

            {/* Right content */}
            <View style={[styles.content, isLast && { paddingBottom: 0 }]}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{evt.title}</Text>
                {evt.verified && (
                  <View style={styles.miniBadge}>
                    <Check size={10} color={colors.green600} strokeWidth={3} />
                    <Text style={styles.miniBadgeText}>On-chain</Text>
                  </View>
                )}
              </View>

              <Text style={styles.meta}>
                {formatTimestamp(evt.timestamp)} · {evt.location}
              </Text>

              <Pressable
                onPress={() => Linking.openURL(explorerUrl(evt.txSignature, cluster))}
                style={({ pressed }) => [styles.sigRow, pressed && { opacity: 0.6 }]}
                accessibilityRole="link"
                accessibilityLabel={`View transaction ${evt.txSignature} on Solana Explorer`}
              >
                <Text style={styles.sigLabel}>Tx</Text>
                <Text style={styles.sigValue}>{truncateSignature(evt.txSignature)}</Text>
                <ExternalLink size={12} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const NODE = 32;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },

  rail: { width: NODE, alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  nodeVerified: {
    backgroundColor: colors.green50,
    borderColor: colors.green500,
  },
  nodePending: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  connector: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.borderStrong,
    marginTop: 2,
    marginBottom: -2,
  },

  content: {
    flex: 1,
    marginLeft: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.green100,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  miniBadgeText: {
    ...typography.caption,
    color: colors.green600,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },

  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  sigLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  sigValue: {
    ...typography.mono,
    color: colors.textPrimary,
    fontSize: 12,
  },
});
