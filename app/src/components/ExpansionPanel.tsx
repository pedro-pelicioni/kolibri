import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

// Enable LayoutAnimation on Android (it's off by default)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  /** Visible label when collapsed */
  label: string;
  /** Visible label when expanded — defaults to "Mostrar menos" */
  labelExpanded?: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}

/** Collapsible section — used on the passport for "Ver mais detalhes". */
export function ExpansionPanel({
  label,
  labelExpanded = 'Mostrar menos',
  initiallyOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(initiallyOpen);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.headerLabel}>{open ? labelExpanded : label}</Text>
        {open ? (
          <ChevronUp size={18} color={colors.brand700} strokeWidth={2.2} />
        ) : (
          <ChevronDown size={18} color={colors.brand700} strokeWidth={2.2} />
        )}
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerLabel: {
    ...typography.bodyStrong,
    color: colors.brand700,
    fontSize: 14,
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xl,
  },
});
