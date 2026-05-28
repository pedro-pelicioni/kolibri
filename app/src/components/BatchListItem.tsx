import React from 'react';
import { Pressable, View, Text, StyleSheet, Image } from 'react-native';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import type { PlantPassport } from '../types/passport';

interface Props {
  passport: PlantPassport;
  onPress?: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Compact row used in the "Recent Certificates" list on Home. */
export function BatchListItem({ passport, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Image
        source={{ uri: passport.photoUri }}
        style={styles.thumb}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{passport.strainName}</Text>
          {passport.verified && (
            <View style={styles.verifiedPill}>
              <ShieldCheck size={10} color={colors.green600} strokeWidth={2.6} />
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {passport.batchLabel} · {passport.netWeightGrams} g
        </Text>
        <Text style={styles.date}>{fmtDate(passport.createdAt)}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 15,
    flexShrink: 1,
  },
  verifiedPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
});
