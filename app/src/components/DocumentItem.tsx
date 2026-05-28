import React from 'react';
import { Pressable, View, Text, StyleSheet, Linking } from 'react-native';
import { FileText, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import type { CertificateDocument } from '../types/passport';

interface Props {
  doc: CertificateDocument;
}

/** Single row in the "Documents" card on the passport — tap opens the PDF. */
export function DocumentItem({ doc }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Abrir ${doc.name}`}
      onPress={() => Linking.openURL(doc.url)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View style={styles.iconWrap}>
        <FileText size={16} color={colors.brand700} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{doc.name}</Text>
        <Text style={styles.meta}>{doc.type.toUpperCase()}</Text>
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
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
});
