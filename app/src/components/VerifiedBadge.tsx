import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface Props {
  /** Override label — defaults to "Verified Authentic" */
  label?: string;
  /** Small (chip) vs. large (hero) variant */
  size?: 'sm' | 'lg';
}

/**
 * The signature trust mark. Used twice on the passport:
 *   - large variant near the strain name (hero)
 *   - small variants inline on individual timeline events
 *
 * Clinical green only — never any other color — so it carries the same
 * weight a real "Verified on Solana" pharma cert would.
 */
export function VerifiedBadge({ label = 'Verified Authentic', size = 'lg' }: Props) {
  const isLg = size === 'lg';
  return (
    <View style={[styles.base, isLg ? styles.lg : styles.sm]}>
      <ShieldCheck
        size={isLg ? 18 : 12}
        color={colors.green600}
        strokeWidth={2.5}
      />
      <Text style={[styles.label, isLg ? styles.labelLg : styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green100,
    borderColor: colors.green500,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  lg: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  label: {
    color: colors.green600,
    fontWeight: '700',
  },
  labelLg: {
    ...typography.bodyStrong,
    color: colors.green600,
    fontSize: 14,
  },
  labelSm: {
    ...typography.caption,
    color: colors.green600,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
