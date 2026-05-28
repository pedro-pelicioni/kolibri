import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import {
  ArrowLeft,
  Share2,
  Leaf,
  CalendarDays,
  Beaker,
  MapPin,
  BadgeCheck,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

import { VerifiedBadge } from '../components/VerifiedBadge';
import { LabDataCard } from '../components/LabDataCard';
import { TraceabilityTimeline } from '../components/TraceabilityTimeline';
import { ProofOfExistenceCard } from '../components/ProofOfExistenceCard';

import type { PlantPassport } from '../types/passport';

interface Props {
  passport: PlantPassport;
  /** Called when the back chevron is pressed */
  onBack?: () => void;
  /** Called when the share icon is pressed */
  onShare?: () => void;
}

// ----- helpers ---------------------------------------------------------------

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// THC compliance threshold per ANVISA RDC 1.015/2026 (max 0.3% w/w).
const THC_LIMIT_PCT = 0.3;

// ----- screen ----------------------------------------------------------------

/**
 * Digital Plant Passport — the hero screen of Kolibri.
 *
 * Layout (top → bottom):
 *   1. Sticky-feel header w/ back + share
 *   2. Strain hero (name, batch label, big verified badge)
 *   3. Quick-fact strip (harvest, weight, cultivator)
 *   4. Lab Panel — 2×2 LabDataCard grid + COA reference
 *   5. Traceability Timeline (vertical stepper)
 *   6. Proof of Existence card (Solana receipt)
 *
 * Everything is composed from small, reusable components in ../components/.
 */
export function PlantPassportScreen({ passport, onBack, onShare }: Props) {
  const thcCompliant = passport.lab.thcPct < THC_LIMIT_PCT;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* --- Header bar --- */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>Digital Plant Passport</Text>
        <Pressable
          onPress={onShare}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Share passport"
        >
          <Share2 size={20} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ Strain Hero ============ */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Leaf size={20} color={colors.green600} strokeWidth={2.2} />
          </View>
          <Text style={styles.heroEyebrow}>Cultivar · {passport.cultivarCode}</Text>
          <Text style={styles.heroTitle}>{passport.strainName}</Text>

          <View style={styles.heroBatchRow}>
            <Text style={styles.heroBatchLabel}>BATCH</Text>
            <Text style={styles.heroBatchValue}>{passport.batchLabel}</Text>
          </View>

          <View style={styles.heroBadge}>
            <VerifiedBadge label="Verified Authentic" size="lg" />
          </View>
        </View>

        {/* ============ Quick-fact strip ============ */}
        <View style={styles.quickStrip}>
          <QuickFact
            icon={CalendarDays}
            label="Harvest"
            value={fmtDate(passport.harvestDate)}
          />
          <View style={styles.quickDivider} />
          <QuickFact
            icon={Beaker}
            label="Net weight"
            value={`${passport.netWeightGrams} g`}
          />
          <View style={styles.quickDivider} />
          <QuickFact
            icon={MapPin}
            label="Farm"
            value={passport.cultivator.farmLocation.split(',')[0]}
          />
        </View>

        {/* ============ Section: Lab Panel ============ */}
        <SectionHeader
          eyebrow="Certificate of Analysis"
          title="Lab Panel"
          right={
            <View style={styles.coaTag}>
              <BadgeCheck size={12} color={colors.green600} strokeWidth={2.6} />
              <Text style={styles.coaTagText}>COA signed</Text>
            </View>
          }
        />

        <View style={styles.cardsGrid}>
          <View style={styles.cardsRow}>
            <LabDataCard
              label="CBD %"
              value={`${passport.lab.cbdPct.toFixed(2)} %`}
              hint="dominant cannabinoid"
              tone="positive"
            />
            <LabDataCard
              label="THC %"
              value={`${passport.lab.thcPct.toFixed(2)} %`}
              hint={`Limit ${THC_LIMIT_PCT}% · ANVISA RDC 1.015`}
              tone={thcCompliant ? 'positive' : 'danger'}
            />
          </View>
          <View style={styles.cardsRow}>
            <LabDataCard
              label="Total cannabinoids"
              value={`${passport.lab.totalCannabinoidsPct.toFixed(2)} %`}
              hint="incl. minor cannabinoids"
            />
            <LabDataCard
              label="Tested by"
              value={passport.lab.labName.split(' ')[0]}
              hint={passport.lab.labLicense}
            />
          </View>

          {/* Lab compliance line — flat, just text strip */}
          <View style={styles.complianceStrip}>
            <ComplianceDot label="Microbiology" pass={passport.lab.microbiology === 'PASS'} />
            <ComplianceDot label="Heavy metals" pass={passport.lab.heavyMetals === 'PASS'} />
            <ComplianceDot label="Solvents" pass={passport.lab.residualSolvents === 'PASS'} />
            <ComplianceDot label="Pesticides" pass={passport.lab.pesticides === 'PASS'} />
          </View>
        </View>

        {/* ============ Section: Traceability Timeline ============ */}
        <SectionHeader
          eyebrow="Supply Chain"
          title="Traceability Timeline"
        />

        <View style={styles.timelineWrap}>
          <TraceabilityTimeline
            events={passport.timeline}
            cluster={passport.proof.network}
          />
        </View>

        {/* ============ Section: Proof of Existence ============ */}
        <SectionHeader eyebrow="Cryptographic Receipt" title="Proof of Existence" />
        <ProofOfExistenceCard proof={passport.proof} />

        {/* Footer fine print */}
        <Text style={styles.fineprint}>
          Cultivated by {passport.cultivator.name} (CNPJ {passport.cultivator.cnpj})
          · License {passport.cultivator.anvisaLicense}.{'\n'}
          Anchored on Solana via Kolibri Compliance Registry.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ----- local subcomponents ---------------------------------------------------

function QuickFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.quickFact}>
      <Icon size={14} color={colors.textMuted} strokeWidth={2.2} />
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function ComplianceDot({ label, pass }: { label: string; pass: boolean }) {
  return (
    <View style={styles.complianceItem}>
      <View
        style={[
          styles.complianceDot,
          { backgroundColor: pass ? colors.green500 : colors.red500 },
        ]}
      />
      <Text style={styles.complianceLabel}>{label}</Text>
    </View>
  );
}

// ----- styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgMuted,
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.section,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },

  // -- Hero -------------------------------------------------------------------
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    ...typography.caption,
    color: colors.brand700,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 30,
    marginBottom: spacing.md,
  },
  heroBatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroBatchLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  heroBatchValue: {
    ...typography.mono,
    color: colors.textPrimary,
    fontSize: 13,
  },
  heroBadge: {
    marginTop: spacing.sm,
  },

  // -- Quick strip ------------------------------------------------------------
  quickStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  quickFact: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'flex-start',
    gap: 2,
  },
  quickLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  quickValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
  quickDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },

  // -- Section headers --------------------------------------------------------
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionEyebrow: {
    ...typography.caption,
    color: colors.brand700,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: 2,
  },

  // -- Lab grid ---------------------------------------------------------------
  cardsGrid: {
    gap: spacing.md,
    marginTop: -spacing.sm,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.green100,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  coaTagText: {
    ...typography.caption,
    color: colors.green600,
    fontSize: 9,
  },
  complianceStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  complianceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  complianceLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
  },

  // -- Timeline ---------------------------------------------------------------
  timelineWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    marginTop: -spacing.sm,
  },

  // -- Footer fine print ------------------------------------------------------
  fineprint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
