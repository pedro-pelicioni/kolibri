import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Plus, QrCode, Search, LogOut } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

import { KolibriLogo } from '../components/KolibriLogo';
import { Section } from '../components/Section';
import { BatchListItem } from '../components/BatchListItem';

import { useSession } from '../context/SessionContext';
import { mockBatches } from '../mocks/passport.mock';
import type { ScreenProps } from '../navigation/types';

export function HomeScreen({ navigation }: ScreenProps<'home'>) {
  const { session, logout } = useSession();

  function confirmLogout() {
    Alert.alert(
      'Sair da conta',
      'Você precisará entrar novamente na próxima vez.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ],
    );
  }

  const initials = (session?.user.name ?? 'OP')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <KolibriLogo size="sm" />
        <Pressable
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="Sair"
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View>
          <Text style={styles.greeting}>Olá, {session?.user.name.split(' ')[0]}</Text>
          <Text style={styles.dispensary}>{session?.user.dispensaryName}</Text>
        </View>

        {/* Primary CTA */}
        <Pressable
          onPress={() => navigation.navigate('create')}
          accessibilityRole="button"
          accessibilityLabel="Criar novo certificado"
          style={({ pressed }) => [styles.ctaCard, pressed && { opacity: 0.92 }]}
        >
          <View style={styles.ctaIconWrap}>
            <Plus size={24} color={colors.brand500} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Criar novo certificado</Text>
            <Text style={styles.ctaSubtitle}>
              Registre um lote no blockchain Solana
            </Text>
          </View>
        </Pressable>

        {/* Recent batches */}
        <Section eyebrow="Lotes" title="Certificados recentes">
          <View style={{ gap: spacing.md }}>
            {mockBatches.map((b) => (
              <BatchListItem
                key={b.batchId}
                passport={b}
                onPress={() => navigation.navigate('passport', { passport: b })}
              />
            ))}
          </View>
        </Section>

        {/* Quick actions */}
        <Section eyebrow="Acesso rápido" title="Ações">
          <View style={styles.actionsRow}>
            <ActionCard
              icon={<QrCode size={20} color={colors.brand700} strokeWidth={2.2} />}
              label="Escanear QR"
              onPress={() => navigation.navigate('scanner')}
            />
            <ActionCard
              icon={<Search size={20} color={colors.brand700} strokeWidth={2.2} />}
              label="Verificar lote"
              onPress={() => Alert.alert('Em breve', 'Busca por batch ID estará disponível na próxima versão.')}
            />
          </View>
        </Section>

        <View style={styles.spacer} />

        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logoutRow, pressed && { opacity: 0.6 }]}
        >
          <LogOut size={16} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]}
    >
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMuted },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    fontSize: 12,
  },
  scroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
    gap: spacing.xl,
  },
  greeting: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 24,
  },
  dispensary: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.brand900,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(20,184,166,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    ...typography.h2,
    color: colors.textInverse,
    fontSize: 17,
  },
  ctaSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  actionLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 13,
  },
  spacer: { height: spacing.lg },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  logoutText: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 13,
  },
});
