import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { QrCode, Nfc, ScanLine, ArrowLeft } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { config } from '../config';
import { resolveQrPayload } from '../api/events';
import { mockPassport } from '../mocks/passport.mock';
import type { ScreenProps } from '../navigation/types';

/**
 * Secondary screen accessible from Home → "Escanear QR". Used when a
 * dispensary operator receives a package and wants to verify the certificate
 * on-chain. Mounts the camera viewfinder (placeholder for now — wire
 * VisionCamera here when ready) and falls back to a demo tap that loads the
 * mock passport.
 */
export function ScannerScreen({ navigation }: ScreenProps<'scanner'>) {
  const [manualCode, setManualCode] = useState('');
  const [resolving, setResolving] = useState(false);

  function handleDemoTap() {
    navigation.replace('passport', { passport: mockPassport });
  }

  async function handleResolve() {
    const code = manualCode.trim();
    if (!code) {
      Alert.alert('Informe um código', 'Cole o batchId, PDA ou URL de verificação.');
      return;
    }
    setResolving(true);
    try {
      const passport = await resolveQrPayload(code);
      navigation.replace('passport', { passport });
    } catch (e) {
      Alert.alert(
        'Não encontrado',
        e instanceof Error ? e.message : 'Verifique se o código está correto.',
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Escanear QR</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Verificação de produto</Text>
        <Text style={styles.heading}>
          Aponte para o QR Code ou aproxime do NFC
        </Text>
        <Text style={styles.lede}>
          Todo produto certificado pela Kolibri carrega um passport digital
          ancorado na Solana. Verifique a autenticidade em menos de 2 segundos.
        </Text>

        <View style={styles.viewfinderWrap}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <ScanLine size={40} color={colors.brand500} strokeWidth={1.5} />
            <Text style={styles.viewfinderHint}>Camera viewfinder</Text>
          </View>

          {config.useStub ? (
            <Pressable
              onPress={handleDemoTap}
              style={({ pressed }) => [styles.demoTap, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Demo: abrir passport"
            >
              <Text style={styles.demoTapText}>Demo · abrir passport mock</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.methodsRow}>
          <Method icon={QrCode} label="QR Code" />
          <Method icon={Nfc} label="NFC Tap" />
        </View>

        {/* Entrada manual — útil enquanto a VisionCamera não está plugada. */}
        <View style={styles.manualBlock}>
          <TextField
            label="Verificar manualmente"
            placeholder="batchId, PDA ou URL"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <PrimaryButton
            label={resolving ? 'Buscando…' : 'Verificar'}
            onPress={handleResolve}
            loading={resolving}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Method({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <View style={styles.method}>
      <Icon size={18} color={colors.textSecondary} strokeWidth={2} />
      <Text style={styles.methodLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 15,
  },
  body: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  eyebrow: { ...typography.caption, color: colors.brand700 },
  heading: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  lede: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  viewfinderWrap: { marginTop: spacing.md },
  viewfinder: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.brand500,
  },
  cornerTL: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  viewfinderHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  demoTap: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  demoTapText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  methodLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  manualBlock: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
