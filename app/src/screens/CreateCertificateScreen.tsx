import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { ArrowLeft, Info, ShieldCheck } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductPhoto } from '../components/ProductPhoto';

import { makeNewBatch } from '../mocks/passport.mock';
import type { ScreenProps } from '../navigation/types';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Minimal "create certificate" form. 5 user fields + an auto-filled cultivator
 * block (pulled from session). Submit fakes a 1.5s blockchain anchor and then
 * navigates to the passport view.
 */
export function CreateCertificateScreen({ navigation }: ScreenProps<'create'>) {
  const [strain, setStrain] = useState('');
  const [cultivar, setCultivar] = useState('');
  const [weight, setWeight] = useState('');
  const [harvest, setHarvest] = useState(todayISO());
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!strain.trim()) next.strain = 'Informe o nome da cepa';
    if (!cultivar.trim()) next.cultivar = 'Informe o código (até 8 caracteres)';
    else if (cultivar.length > 8) next.cultivar = 'Máximo 8 caracteres';
    if (!weight.trim()) next.weight = 'Informe o peso em gramas';
    else if (Number.isNaN(Number(weight))) next.weight = 'Apenas números';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(harvest)) {
      next.harvest = 'Use formato AAAA-MM-DD';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Mock blockchain anchor — in production this becomes:
      //   const built = await api.post('/tx/build/cannabis-event', payload)
      //   const signed = await signAndSubmitEvent(session, built.tx_bytes_b64)
      //   await api.post('/tx/submit', { event_id, signed_tx_b64 })
      await new Promise<void>((r) => { setTimeout(r, 1500); });
      const newPassport = makeNewBatch({
        strainName: strain.trim(),
        cultivarCode: cultivar.trim().toUpperCase(),
        netWeightGrams: Number(weight),
        harvestDate: new Date(harvest).toISOString(),
        notes: notes.trim(),
      });
      navigation.replace('passport', { passport: newPassport });
    } catch (e) {
      Alert.alert(
        'Erro ao ancorar',
        e instanceof Error ? e.message : 'Tente novamente',
      );
    } finally {
      setSubmitting(false);
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
        <Text style={styles.title}>Novo certificado</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>Cadastro de lote</Text>
          <Text style={styles.heading}>Informações do produto</Text>
          <Text style={styles.lede}>
            Os dados abaixo serão imutavelmente ancorados na Solana via Seed
            Vault e ficarão disponíveis para consulta pública via QR.
          </Text>

          <View style={styles.photoRow}>
            <ProductPhoto size={96} onPickImage={() => Alert.alert('Em breve', 'Captura de foto será habilitada no próximo build (Vision Camera).')} />
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Text style={styles.photoLabel}>Foto do produto</Text>
              <Text style={styles.photoHint}>
                Imagem clara do lote embalado. Recomendado: 1024×1024.
              </Text>
            </View>
          </View>

          <TextField
            label="Nome da cepa"
            placeholder="Cannatonic CBD"
            value={strain}
            onChangeText={setStrain}
            error={errors.strain}
          />
          <TextField
            label="Código do cultivar (até 8 caracteres)"
            placeholder="HEM:CBD1"
            value={cultivar}
            onChangeText={setCultivar}
            autoCapitalize="characters"
            maxLength={8}
            error={errors.cultivar}
          />
          <TextField
            label="Peso líquido (gramas)"
            placeholder="30"
            value={weight}
            onChangeText={setWeight}
            keyboardType="number-pad"
            error={errors.weight}
          />
          <TextField
            label="Data de colheita"
            placeholder="AAAA-MM-DD"
            value={harvest}
            onChangeText={setHarvest}
            error={errors.harvest}
            hint="Formato ISO: AAAA-MM-DD"
          />
          <TextField
            label="Notas / Genótipo"
            placeholder="CBD-dominant phenotype, indoor, organic"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          {/* Lab data pending notice */}
          <View style={styles.notice}>
            <Info size={16} color={colors.brand700} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Dados laboratoriais pendentes</Text>
              <Text style={styles.noticeBody}>
                Os resultados de CBD/THC e microbiologia serão anexados quando o
                laboratório assinar o COA.
              </Text>
            </View>
          </View>

          {/* Anchor authority info */}
          <View style={styles.anchor}>
            <ShieldCheck size={16} color={colors.green600} strokeWidth={2.4} />
            <Text style={styles.anchorText}>
              Assinatura via Seed Vault na Solana (devnet)
            </Text>
          </View>

          <PrimaryButton
            label={submitting ? 'Ancorando no blockchain…' : 'Criar e ancorar'}
            onPress={handleSubmit}
            loading={submitting}
          />

          <Text style={styles.fineprint}>
            Ao confirmar, você atesta que as informações são verdadeiras nos
            termos da RDC ANVISA 1.015/2026.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.brand700,
  },
  heading: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 24,
    marginTop: spacing.xs,
  },
  lede: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  photoLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  photoHint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  noticeTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 13,
  },
  noticeBody: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  anchor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  anchorText: {
    ...typography.caption,
    color: colors.green600,
    fontSize: 11,
  },
  fineprint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
