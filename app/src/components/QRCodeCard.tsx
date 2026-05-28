import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface Props {
  /** Payload encoded into the QR (typically a verify URL) */
  value: string;
  /** Edge length of the inner code in pixels */
  size?: number;
}

/**
 * QR code with the four-edge "ESCANEIE PARA VERIFICAR" frame from the
 * Certimine reference. Used as a floating element on the passport.
 *
 * Render strategy: a dark square is the outer card; the inner QR sits centred
 * with hairline padding; tiny labels are positioned on the 4 borders.
 */
export function QRCodeCard({ value, size = 132 }: Props) {
  const padding = 14;
  const cardSize = size + padding * 2;

  return (
    <View
      style={[
        styles.card,
        { width: cardSize, height: cardSize, borderRadius: radius.md },
      ]}
    >
      {/* Top label */}
      <View style={[styles.labelStrip, styles.labelTop]}>
        <Text style={styles.labelText}>ESCANEIE PARA VERIFICAR</Text>
      </View>
      {/* Bottom label */}
      <View style={[styles.labelStrip, styles.labelBottom]}>
        <Text style={styles.labelText}>ESCANEIE PARA VERIFICAR</Text>
      </View>
      {/* Left label (rotated) */}
      <View style={[styles.labelStripVert, styles.labelLeft, { height: cardSize }]}>
        <Text style={styles.labelText}>ESCANEIE PARA VERIFICAR</Text>
      </View>
      {/* Right label (rotated) */}
      <View style={[styles.labelStripVert, styles.labelRight, { height: cardSize }]}>
        <Text style={styles.labelText}>ESCANEIE PARA VERIFICAR</Text>
      </View>

      <View style={styles.qrWrap}>
        <QRCode
          value={value}
          size={size}
          color={colors.textInverse}
          backgroundColor={colors.brand900}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand900,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  qrWrap: {
    padding: spacing.xs,
  },
  labelStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelStripVert: {
    position: 'absolute',
    top: 0,
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelTop: { top: 0 },
  labelBottom: { bottom: 0 },
  labelLeft: { left: 0 },
  labelRight: { right: 0 },
  labelText: {
    ...typography.caption,
    color: colors.green500,
    fontSize: 7,
    letterSpacing: 0.8,
  },
});
