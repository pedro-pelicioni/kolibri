import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface Props {
  eyebrow?: string;
  title?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/** Re-usable section header + body wrapper used across screens. */
export function Section({ eyebrow, title, right, style, children }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      {(eyebrow || title || right) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
            {title && <Text style={styles.title}>{title}</Text>}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.caption,
    color: colors.brand700,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: 2,
  },
});
