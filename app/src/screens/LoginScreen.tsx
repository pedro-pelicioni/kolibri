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
import { Wallet } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

import { KolibriLogo } from '../components/KolibriLogo';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';

import { useSession } from '../context/SessionContext';
import { connectWallet } from '../wallet/MobileWalletAdapter';

/**
 * Login screen — entry point of the ERP. Mock auth: any non-empty email/password
 * succeeds. Replace `login(...)` with a real SIWS round-trip when wiring the
 * gateway.
 */
export function LoginScreen() {
  const { login, loginWithWallet } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no login');
    } finally {
      setBusy(false);
    }
  }

  async function handleWallet() {
    setWalletBusy(true);
    setError(null);
    try {
      const session = await connectWallet('devnet');
      await loginWithWallet(session.publicKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao conectar carteira');
    } finally {
      setWalletBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <KolibriLogo size="lg" />
          </View>

          <Text style={styles.eyebrow}>Acesso restrito</Text>
          <Text style={styles.title}>Entrar no painel</Text>
          <Text style={styles.lede}>
            Plataforma de rastreabilidade seed-to-sale conforme ANVISA RDC
            1.015/2026 e LGPD. Use suas credenciais corporativas.
          </Text>

          <View style={styles.form}>
            <TextField
              label="Email corporativo"
              placeholder="operador@dispensario.com.br"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
            <TextField
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton
              label="Entrar"
              loading={busy}
              disabled={walletBusy}
              onPress={handleLogin}
            />

            <Pressable
              onPress={() => Alert.alert('Em breve', 'Recuperação de senha será habilitada na próxima versão.')}
              style={({ pressed }) => [styles.forgot, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <SecondaryButton
            label="Conectar com carteira (Seed Vault)"
            leftIcon={<Wallet size={16} color={colors.brand700} strokeWidth={2.2} />}
            onPress={handleWallet}
            disabled={busy || walletBusy}
          />

          <Text style={styles.footer}>
            Powered by{' '}
            <Text style={styles.footerStrong}>DPO2U</Text>
            {' · '}
            anchored on{' '}
            <Text style={styles.footerStrong}>Solana</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.section,
    gap: spacing.lg,
  },
  brandRow: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.brand700,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 28,
    marginTop: spacing.xs,
  },
  lede: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
  error: {
    ...typography.body,
    color: colors.red500,
    fontSize: 13,
  },
  forgot: { alignSelf: 'center', paddingVertical: spacing.sm },
  forgotText: {
    ...typography.body,
    color: colors.brand700,
    fontSize: 13,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  footer: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footerStrong: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
