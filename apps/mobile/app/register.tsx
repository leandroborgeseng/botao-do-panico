import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Switch,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth, setToken } from '@/lib/api';
import { setStoredToken, setStoredUser } from '@/lib/storage';
import { registerPushTokenIfPossible } from '@/lib/push-notifications';
import { fetchAddressByCep } from '@/lib/viacep';
import { colors, spacing, radius, typography, cardStyle, inputStyle, primaryButtonStyle } from '@/lib/theme';

function stripDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCpfDisplay(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [supportOnly, setSupportOnly] = useState(false);
  const [contactCpfs, setContactCpfs] = useState<string[]>(['', '', '']);
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cepError, setCepError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@panico_terms_accepted')
      .then((v) => setTermsAccepted(v === '1'))
      .catch(() => {});
  }, []);

  async function handleCepBlur() {
    const digits = stripDigits(cep);
    if (digits.length !== 8) return;
    setLoadingCep(true);
    setCepError('');
    try {
      const data = await fetchAddressByCep(cep);
      if (data) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
      } else {
        setCepError('CEP não encontrado.');
      }
    } catch (e) {
      setCepError(e instanceof Error ? e.message : 'Erro ao buscar CEP.');
    } finally {
      setLoadingCep(false);
    }
  }

  function handleCepChange(text: string) {
    const d = stripDigits(text).slice(0, 8);
    setCep(d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`);
  }

  function handleCpfChange(text: string) {
    const d = stripDigits(text).slice(0, 11);
    if (d.length <= 3) setCpf(d);
    else if (d.length <= 6) setCpf(`${d.slice(0, 3)}.${d.slice(3)}`);
    else if (d.length <= 9) setCpf(`${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`);
    else setCpf(`${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`);
  }

  function handleContactCpfChange(index: number, text: string) {
    const d = stripDigits(text).slice(0, 11);
    const formatted = d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0, 3)}.${d.slice(3)}` : d.length <= 9 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}` : `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
    const next = [...contactCpfs];
    next[index] = formatted;
    setContactCpfs(next);
  }

  async function handleRegister() {
    Keyboard.dismiss();
    if (!termsAccepted) {
      setError('Você precisa aceitar os termos de uso para continuar.');
      return;
    }
    const cpfDigits = stripDigits(cpf);
    if (cpfDigits.length !== 11) {
      setError('CPF deve ter 11 dígitos.');
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName || !email.trim() || !password) {
      setError('Preencha nome, sobrenome, e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (!supportOnly) {
      const list = [...new Set(contactCpfs.map((s) => stripDigits(s)).filter((s) => s.length === 11))];
      const selfCpf = cpfDigits;
      if (list.some((c) => c === selfCpf)) {
        setError('Você não pode se adicionar como contato.');
        return;
      }
    }
    setError('');
    setCepError('');
    setLoading(true);
    try {
      const contactCpfsDigits = supportOnly ? undefined : contactCpfs.map((s) => stripDigits(s)).filter((s) => s.length === 11);
      const result = await auth.register({
        name: fullName,
        email: email.trim(),
        cpf: cpfDigits,
        password,
        supportOnly,
        contactCpfs: contactCpfsDigits?.length ? contactCpfsDigits : undefined,
        cep: cep || undefined,
        street: street || undefined,
        number: number || undefined,
        complement: complement || undefined,
        neighborhood: neighborhood || undefined,
        city: city || undefined,
        state: state || undefined,
      });

      const notFound = result.notFoundCpfs ?? [];
      if (notFound.length > 0) {
        const msg = `Os seguintes CPFs ainda não estão cadastrados no app:\n${notFound.map((c) => formatCpfDisplay(c)).join('\n')}\n\nAvise essas pessoas para baixar o aplicativo e se cadastrar. Você já foi cadastrado e os contatos que já estavam no app foram vinculados.`;
        Alert.alert('Contatos não cadastrados', msg, [
          {
            text: 'Entendi',
            onPress: () => finishLogin(),
          },
        ]);
      } else {
        await finishLogin();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  async function finishLogin() {
    const { access_token, user } = await auth.login(email.trim(), password);
    setToken(access_token);
    await setStoredToken(access_token);
    await setStoredUser(JSON.stringify(user));
    registerPushTokenIfPossible().catch(() => {});
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo-prefeitura-franca.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Prefeitura de Franca"
          />
        </View>
        <Text style={styles.subtitle}>Cadastre-se para usar o Botão do Pânico. CPF é obrigatório.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.section}>Dados pessoais</Text>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor={colors.gray}
          value={firstName}
          onChangeText={setFirstName}
        />
        <Text style={styles.label}>Sobrenome *</Text>
        <TextInput
          style={styles.input}
          placeholder="Sobrenome"
          placeholderTextColor={colors.gray}
          value={lastName}
          onChangeText={setLastName}
        />
        <Text style={styles.label}>E-mail *</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={colors.gray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>CPF *</Text>
        <TextInput
          style={styles.input}
          placeholder="000.000.000-00"
          placeholderTextColor={colors.gray}
          value={cpf}
          onChangeText={handleCpfChange}
          keyboardType="number-pad"
          maxLength={14}
        />
        <Text style={styles.label}>Senha * (mín. 6 caracteres)</Text>
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.section}>Tipo de uso</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Sou apenas contato de apoio</Text>
          <Switch
            value={supportOnly}
            onValueChange={setSupportOnly}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
        <Text style={styles.hint}>
          Se você só vai receber alertas de alguém (não vai cadastrar seus próprios contatos de emergência), marque esta opção.
        </Text>

        {!supportOnly && (
          <>
            <Text style={styles.section}>Contatos de emergência (até 3)</Text>
            <Text style={styles.hint}>
              Informe o CPF de até 3 pessoas que receberão seu alerta. Elas precisam estar cadastradas no app. Se não estiverem, você será avisado para pedir que baixem o app e se cadastrem.
            </Text>
            {[0, 1, 2].map((i) => (
              <View key={i}>
                <Text style={styles.label}>CPF contato {i + 1}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.gray}
                  value={contactCpfs[i]}
                  onChangeText={(t) => handleContactCpfChange(i, t)}
                  keyboardType="number-pad"
                  maxLength={14}
                />
              </View>
            ))}
          </>
        )}

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

        <Text style={styles.section}>Endereço (opcional)</Text>
        <Text style={styles.label}>CEP</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputCep]}
            placeholder="00000-000"
            placeholderTextColor={colors.gray}
            value={cep}
            onChangeText={handleCepChange}
            onBlur={handleCepBlur}
            keyboardType="number-pad"
            maxLength={9}
          />
          {loadingCep ? <ActivityIndicator size="small" color={colors.primary} style={styles.cepLoader} /> : null}
        </View>
        {cepError ? <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{cepError}</Text> : null}
        <Text style={styles.label}>Rua</Text>
        <TextInput
          style={styles.input}
          placeholder="Logradouro"
          placeholderTextColor={colors.gray}
          value={street}
          onChangeText={setStreet}
        />
        <View style={styles.row2}>
          <View style={styles.half}>
            <Text style={styles.label}>Número</Text>
            <TextInput
              style={styles.input}
              placeholder="Nº"
              placeholderTextColor={colors.gray}
              value={number}
              onChangeText={setNumber}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Complemento</Text>
            <TextInput
              style={styles.input}
              placeholder="Apto, bloco..."
              placeholderTextColor={colors.gray}
              value={complement}
              onChangeText={setComplement}
            />
          </View>
        </View>
        <Text style={styles.label}>Bairro</Text>
        <TextInput
          style={styles.input}
          placeholder="Bairro"
          placeholderTextColor={colors.gray}
          value={neighborhood}
          onChangeText={setNeighborhood}
        />
        <View style={styles.row2}>
          <View style={styles.half}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              placeholder="Cidade"
              placeholderTextColor={colors.gray}
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={styles.halfSmall}>
            <Text style={styles.label}>UF</Text>
            <TextInput
              style={styles.input}
              placeholder="UF"
              placeholderTextColor={colors.gray}
              value={state}
              onChangeText={setState}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>Já tem conta? Entrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  logoContainer: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: '100%', maxWidth: 240, height: 64 },
  subtitle: { ...typography.bodySmall, color: colors.gray, marginBottom: spacing.md },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  label: { ...typography.label, color: colors.gray, marginBottom: spacing.xs },
  section: { ...typography.section, color: colors.primary, marginTop: spacing.lg, marginBottom: spacing.md },
  hint: { ...typography.bodySmall, color: colors.gray, marginBottom: spacing.md },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  switchLabel: { ...typography.body, color: colors.text },
  input: { ...inputStyle, marginBottom: spacing.md },
  inputCep: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row2: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  halfSmall: { width: 80 },
  cepLoader: { marginBottom: spacing.md },
  button: { ...primaryButtonStyle, marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: colors.onPrimary },
  linkButton: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { ...typography.body, color: colors.link, fontWeight: '600' },
});
