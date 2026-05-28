import React from 'react';
import { Pressable, Text, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface Props {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

/** Outline button — used as the alternate action ("ou conectar com carteira"). */
export function SecondaryButton({
  label,
  onPress,
  disabled,
  leftIcon,
  rightIcon,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        pressed && !disabled && { opacity: 0.7 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <Text style={styles.label}>{label}</Text>
      {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.brand700,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    minHeight: 50,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.brand700,
    fontSize: 14,
  },
  icon: {
    marginHorizontal: 2,
  },
});
