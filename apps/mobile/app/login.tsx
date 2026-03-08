import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth, setToken, panicEvents } from '@/lib/api';
import { setStoredToken, setStoredRefreshToken, setStoredUser } from '@/lib/storage';
import { registerPushTokenIfPossible } from '@/lib/push-notifications';
import { ENABLE_REGISTRATION } from '@/lib/feature-flags';
import { colors, spacing, radius, typography, cardStyle, inputStyle, primaryButtonStyle } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@panico_terms_accepted')
      .then((v) => setTermsAccepted(v === '1'))
      .catch(() => {});
  }, []);

  async function handleLogin() {
    Keyboard.dismiss();
    if (!termsAccepted) {
      setError('Você precisa aceitar os termos de uso para continuar.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { access_token, refresh_token, user } = await auth.login(email.trim(), password);
      setToken(access_token);
      await setStoredToken(access_token);
      if (refresh_token) await setStoredRefreshToken(refresh_token);
      await setStoredUser(JSON.stringify(user));
      registerPushTokenIfPossible().catch(() => {});
      // Após login, se houver alertas abertos que você recebeu como contato, abra diretamente a tela de alertas.
      try {
        const received = await panicEvents.received();
        const openAlerts = received.filter((ev) => ev.status === 'OPEN');
        if (openAlerts.length > 0) {
          // Vai direto para o detalhe do primeiro alerta aberto.
          router.replace(`/(tabs)/received/${openAlerts[0].id}` as const);
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo-prefeitura-franca.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Prefeitura de Franca"
          />
        </View>
        <Text style={styles.title}>Botão do Pânico</Text>
        <Text style={styles.subtitle}>Entre com sua conta para continuar</Text>

        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={colors.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
              const next = !termsAccepted;
              setTermsAccepted(next);
              AsyncStorage.setItem('@panico_terms_accepted', next ? '1' : '0').catch(() => {});
            }}
          >
            <View
              style={[
                styles.checkbox,
                { backgroundColor: termsAccepted ? colors.primary : 'transparent', borderColor: colors.primary },
              ]}
            />
            <Text style={styles.termsText}>
              Li e aceito os termos de uso, incluindo a gravação de voz e o uso da minha localização em caso de emergência.
            </Text>
          </TouchableOpacity>
        </View>

        {ENABLE_REGISTRATION ? (
          <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/register')}>
            <Text style={styles.registerLinkText}>Não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    maxWidth: 280,
    height: 72,
  },
  title: {
    ...typography.titleSmall,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.gray,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  card: {
    ...cardStyle,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.md,
  },
  input: {
    ...inputStyle,
    marginBottom: spacing.md,
  },
  button: {
    ...primaryButtonStyle,
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.onPrimary,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  termsText: {
    ...typography.caption,
    color: colors.gray,
    flex: 1,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  registerLinkText: {
    ...typography.body,
    color: colors.link,
    fontWeight: '600',
  },
});
