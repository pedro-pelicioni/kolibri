import React from 'react';
import { View, Image, Text, StyleSheet, Pressable } from 'react-native';
import { Camera, ImagePlus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface Props {
  uri?: string;
  size?: number;            // square edge in pixels
  /** Show camera affordance + handler. If omitted, renders as static thumbnail. */
  onPickImage?: () => void;
}

/**
 * Product photo tile. Two modes:
 *   - Static (uri present, no onPickImage): clean rounded image
 *   - Picker (onPickImage present): button-like surface with camera icon
 */
export function ProductPhoto({ uri, size = 80, onPickImage }: Props) {
  if (uri && !onPickImage) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: radius.md }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Trocar foto' : 'Adicionar foto'}
      onPress={onPickImage}
      style={({ pressed }) => [
        styles.picker,
        { width: size, height: size, borderRadius: radius.md },
        pressed && { opacity: 0.7 },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: radius.md }]}
          resizeMode="cover"
        />
      ) : (
        <>
          <ImagePlus size={Math.round(size * 0.3)} color={colors.textMuted} strokeWidth={1.6} />
          <Text style={styles.label}>Adicionar foto</Text>
        </>
      )}
      {uri && (
        <View style={styles.swap}>
          <Camera size={14} color={colors.textInverse} strokeWidth={2.2} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceAlt,
  },
  picker: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
  },
  swap: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
