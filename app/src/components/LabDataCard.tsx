import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

type Tone = 'neutral' | 'positive' | 'warning' | 'danger';

interface Props {
  label: string;        // small uppercase caption ("CBD %")
  value: string;        // big number ("18.42 %")
  hint?: string;        // tiny line below ("regulatory limit < 0.3 %")
  tone?: Tone;          // colors the value strip
  testID?: string;
}

/**
 * The lab/COA data tile — small, dense, clinical.
 * 4 of these laid out in a 2×2 grid make up the lab panel section.
 */
export function LabDataCard({ label, value, hint, tone = 'neutral', testID }: Props) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={[styles.toneStripe, toneStyles[tone]]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  toneStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.numeric,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});

const toneStyles = StyleSheet.create({
  neutral:  { backgroundColor: colors.borderStrong },
  positive: { backgroundColor: colors.green500 },
  warning:  { backgroundColor: colors.amber500 },
  danger:   { backgroundColor: colors.red500 },
});
