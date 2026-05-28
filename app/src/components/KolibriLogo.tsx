import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'mark'; // full = icon + wordmark; mark = icon only
}

/**
 * Brand logo. Composed inline (no asset file) so it scales crisply at any size
 * and stays editable without round-tripping through an SVG editor.
 * Visual: rounded square mark with a leaf + "kolibri" wordmark in dark slate.
 */
export function KolibriLogo({ size = 'md', variant = 'full' }: Props) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 48 : 36;
  const iconSize = Math.round(dim * 0.55);
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 26 : 20;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          { width: dim, height: dim, borderRadius: dim * 0.28 },
        ]}
      >
        <Leaf size={iconSize} color={colors.textInverse} strokeWidth={2.4} />
      </View>
      {variant === 'full' && (
        <Text style={[styles.word, { fontSize }]}>kolibri</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    backgroundColor: colors.brand900,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  word: {
    ...typography.h2,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
});
