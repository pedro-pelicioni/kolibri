import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

/**
 * Clean text input with floating-style label above and focus ring.
 * Matches the Certimine/clinical aesthetic — no decoration, just type.
 */
export function TextField({
  label,
  error,
  hint,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          rest.multiline && styles.inputMultiline,
        ]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  inputFocused: {
    borderColor: colors.brand500,
    backgroundColor: colors.bg,
  },
  inputError: {
    borderColor: colors.red500,
  },
  error: {
    ...typography.body,
    color: colors.red500,
    fontSize: 12,
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 12,
  },
});
