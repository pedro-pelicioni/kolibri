import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Pressable,
  Image,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Share2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

import { KolibriLogo } from '../components/KolibriLogo';
import { Section } from '../components/Section';
import { DocumentItem } from '../components/DocumentItem';
import { QRCodeCard } from '../components/QRCodeCard';
import { ExpansionPanel } from '../components/ExpansionPanel';

import { LabDataCard } from '../components/LabDataCard';
import { TraceabilityTimeline } from '../components/TraceabilityTimeline';
import { ProofOfExistenceCard } from '../components/ProofOfExistenceCard';
import { VerifiedBadge } from '../components/VerifiedBadge';

import { truncateSignature } from '../wallet/MobileWalletAdapter';
import type { ScreenProps } from '../navigation/types';

const THC_LIMIT_PCT = 0.3;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

/**
 * Public passport — Certimine-style layout.
 *
 * Top half is the "public face" everyone sees: photo, ID, name, owner,
 * documents, address, QR. Tap "Faça login para ver mais detalhes" to expand
 * the dense lab panel + traceability timeline + on-chain proof footer.
 */
export function PlantPassportScreen({ route, navigation }: ScreenProps<'passport'>) {
  const { passport } = route.params;
  const [ownerOpen, setOwnerOpen] = useState(false);

  const verifyUrl = `https://dpo2u.com/kolibri/verify/${passport.batchId}`;

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
        <KolibriLogo size="sm" variant="full" />
        <Pressable
          onPress={() => Linking.openURL(verifyUrl)}
          accessibilityRole="button"
          accessibilityLabel="Compartilhar"
          hitSlop={12}
        >
          <Share2 size={20} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Hero: photo + ID + date ---- */}
        <View style={styles.heroRow}>
          <Image source={{ uri: passport.photoUri }} style={styles.heroPhoto} />
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Passaporte de Produto Blockchain</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ID:</Text>
              <Text style={styles.metaValueMono}>
                {truncateSignature(passport.proof.txSignature, 4, 4)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Data:</Text>
              <Text style={styles.metaValue}>{fmtDate(passport.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ---- Title ---- */}
        <Text style={styles.title}>
          {passport.strainName} — {passport.netWeightGrams} (g)
        </Text>

        {/* ---- Owner card ---- */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Proprietário</Text>
          <Text style={styles.cardValue}>{passport.cultivator.name}</Text>
          <Pressable
            onPress={() => setOwnerOpen((o) => !o)}
            style={({ pressed }) => [styles.verMaisRow, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Text style={styles.verMais}>{ownerOpen ? 'Ver menos' : 'Ver mais'}</Text>
            {ownerOpen ? (
              <ChevronUp size={14} color={colors.green600} strokeWidth={2.4} />
            ) : (
              <ChevronDown size={14} color={colors.green600} strokeWidth={2.4} />
            )}
          </Pressable>
          {ownerOpen && (
            <View style={styles.ownerDetails}>
              <DetailRow label="CNPJ" value={passport.cultivator.cnpj} />
              <DetailRow
                label="Licença ANVISA"
                value={passport.cultivator.anvisaLicense}
              />
              <DetailRow label="Cultivar" value={passport.cultivarCode} />
              <DetailRow label="Lote" value={passport.batchLabel} />
            </View>
          )}
        </View>

        {/* ---- Documents ---- */}
        <View style={[styles.card, styles.cardWithBadge]}>
          <View style={styles.docHeader}>
            <Text style={styles.cardLabel}>Documentos</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{passport.documents.length}</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing.xs }}>
            {passport.documents.map((doc, i) => (
              <View key={doc.url}>
                {i > 0 && <View style={styles.hairline} />}
                <DocumentItem doc={doc} />
              </View>
            ))}
          </View>
        </View>

        {/* ---- Address + floating QR ---- */}
        <View style={styles.addressBlock}>
          <View style={[styles.card, { paddingRight: 140 }]}>
            <View style={styles.addressTitleRow}>
              <MapPin size={14} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.cardLabel}>Endereço</Text>
            </View>
            <Text style={[styles.cardValue, { fontSize: 14 }]}>
              {passport.cultivator.farmLocation}
            </Text>
            <View style={styles.dispensaryLine}>
              <Building2 size={12} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.dispensaryText} numberOfLines={1}>
                {passport.cultivator.name}
              </Text>
            </View>
          </View>

          {/* Floating QR — right-edge, vertically centred */}
          <View style={styles.qrFloat}>
            <QRCodeCard value={verifyUrl} size={108} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* ---- Login-gated details ---- */}
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            Faça login para ver mais detalhes
          </Text>
        </View>

        <ExpansionPanel
          label="Ver detalhes técnicos do lote"
          labelExpanded="Ocultar detalhes"
        >
          {/* Verified badge */}
          <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <VerifiedBadge label="Autêntico · verificado on-chain" />
          </View>

          {/* Lab grid */}
          <View>
            <Text style={styles.detailsHeading}>Painel laboratorial</Text>
            <View style={styles.labRow}>
              <LabDataCard
                label="CBD %"
                value={`${passport.lab.cbdPct.toFixed(2)} %`}
                hint="dominante"
                tone="positive"
              />
              <LabDataCard
                label="THC %"
                value={`${passport.lab.thcPct.toFixed(2)} %`}
                hint={`limite ${THC_LIMIT_PCT}%`}
                tone={passport.lab.thcPct < THC_LIMIT_PCT ? 'positive' : 'danger'}
              />
            </View>
            <View style={[styles.labRow, { marginTop: spacing.md }]}>
              <LabDataCard
                label="Total cannabinoides"
                value={`${passport.lab.totalCannabinoidsPct.toFixed(2)} %`}
              />
              <LabDataCard
                label="Laboratório"
                value={passport.lab.labName.split(' ')[0]}
                hint={passport.lab.labLicense}
              />
            </View>
          </View>

          {/* Timeline */}
          <View>
            <Text style={styles.detailsHeading}>Linha do tempo</Text>
            <TraceabilityTimeline
              events={passport.timeline}
              cluster={passport.proof.network}
            />
          </View>

          {/* On-chain proof */}
          <ProofOfExistenceCard proof={passport.proof} />
        </ExpansionPanel>

        <Text style={styles.fineprint}>
          Documento digital emitido por {passport.cultivator.name} · CNPJ{' '}
          {passport.cultivator.cnpj}. Anchored on Solana via Kolibri Compliance
          Registry.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
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
  scroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
    gap: spacing.lg,
  },

  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroPhoto: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  eyebrow: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaLabel: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 12,
  },
  metaValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 13,
  },
  metaValueMono: {
    ...typography.mono,
    color: colors.textPrimary,
    fontSize: 12,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // Title
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 26,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  cardWithBadge: { position: 'relative' },
  cardLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: spacing.xs,
  },
  cardValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 16,
  },
  verMaisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  verMais: {
    ...typography.body,
    color: colors.green600,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  ownerDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 13,
    flexShrink: 1,
    marginLeft: spacing.md,
  },

  // Documents
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontSize: 10,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  // Address + QR
  addressBlock: {
    position: 'relative',
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  dispensaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dispensaryText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  qrFloat: {
    position: 'absolute',
    right: -spacing.md,
    top: '50%',
    marginTop: -68,
    transform: [{ rotate: '-6deg' }],
  },

  // Login prompt
  loginPrompt: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loginPromptText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Details inside expansion
  detailsHeading: {
    ...typography.caption,
    color: colors.brand700,
    marginBottom: spacing.md,
  },
  labRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  fineprint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
