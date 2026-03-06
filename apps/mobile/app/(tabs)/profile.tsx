import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Switch,
} from 'react-native';
import { auth } from '@/lib/api';
import { fetchAddressByCep } from '@/lib/viacep';
import { colors, spacing, radius, typography, cardStyle, inputStyle, primaryButtonStyle } from '@/lib/theme';
import { getDisguiseMode, setDisguiseMode } from '@/lib/settings';

function stripDigits(s: string) {
  return s.replace(/\D/g, '');
}

export default function ProfileScreen() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    cpf?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [disguiseMode, setDisguiseModeState] = useState(false);

  function load() {
    auth
      .me()
      .then((u) => {
        setUser(u);
        const parts = (u.name || '').trim().split(/\s+/);
        setFirstName(parts[0] ?? '');
        setLastName(parts.slice(1).join(' ') ?? '');
        setCep(u.cep ?? '');
        setStreet(u.street ?? '');
        setNumber(u.number ?? '');
        setComplement(u.complement ?? '');
        setNeighborhood(u.neighborhood ?? '');
        setCity(u.city ?? '');
        setState(u.state ?? '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    getDisguiseMode().then(setDisguiseModeState).catch(() => {});
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function handleCepBlur() {
    const digits = stripDigits(cep);
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const data = await fetchAddressByCep(cep);
      if (data) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
      }
    } finally {
      setLoadingCep(false);
    }
  }

  function handleCepChange(text: string) {
    const d = stripDigits(text).slice(0, 8);
    setCep(d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`);
  }

  async function handleSave() {
    Keyboard.dismiss();
    setSaving(true);
    setError('');
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await auth.updateMe({
        name: fullName || undefined,
        cep: cep || undefined,
        street: street || undefined,
        number: number || undefined,
        complement: complement || undefined,
        neighborhood: neighborhood || undefined,
        city: city || undefined,
        state: state || undefined,
      });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Erro ao carregar'}</Text>
        <TouchableOpacity
          style={[primaryButtonStyle, { marginTop: 16 }]}
          onPress={() => { setError(''); setLoading(true); load(); }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.section}>Configurações</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Modo discreto</Text>
            <Text style={styles.hint}>
              Camufla a tela do botão de pânico como uma interface comum.
            </Text>
          </View>
          <Switch
            value={disguiseMode}
            onValueChange={(v) => {
              setDisguiseModeState(v);
              setDisguiseMode(v).catch(() => {});
            }}
          />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Dados pessoais</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
        placeholder="Nome"
        placeholderTextColor={colors.gray}
        value={firstName}
        onChangeText={setFirstName}
      />
      <Text style={styles.label}>Sobrenome</Text>
      <TextInput
        style={styles.input}
        placeholder="Sobrenome"
        placeholderTextColor={colors.gray}
        value={lastName}
        onChangeText={setLastName}
      />
      <Text style={styles.label}>E-mail</Text>
      <Text style={styles.value}>{user.email}</Text>
      <Text style={styles.label}>CPF</Text>
        <Text style={styles.value}>{user.cpf ? `***.***.***-${user.cpf.slice(-2)}` : '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Endereço</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>CEP</Text>
      <TextInput
        style={styles.input}
        placeholder="00000-000"
        placeholderTextColor={colors.gray}
        value={cep}
        onChangeText={handleCepChange}
        onBlur={handleCepBlur}
        keyboardType="number-pad"
        maxLength={9}
      />
      <Text style={styles.label}>Rua</Text>
      <TextInput
        style={styles.input}
        placeholder="Logradouro"
        placeholderTextColor={colors.gray}
        value={street}
        onChangeText={setStreet}
      />
      <Text style={styles.label}>Número</Text>
      <TextInput
        style={styles.input}
        placeholder="Nº"
        placeholderTextColor={colors.gray}
        value={number}
        onChangeText={setNumber}
      />
      <Text style={styles.label}>Complemento</Text>
      <TextInput
        style={styles.input}
        placeholder="Apto, bloco..."
        placeholderTextColor={colors.gray}
        value={complement}
        onChangeText={setComplement}
      />
      <Text style={styles.label}>Bairro</Text>
      <TextInput
        style={styles.input}
        placeholder="Bairro"
        placeholderTextColor={colors.gray}
        value={neighborhood}
        onChangeText={setNeighborhood}
      />
      <Text style={styles.label}>Cidade</Text>
      <TextInput
        style={styles.input}
        placeholder="Cidade"
        placeholderTextColor={colors.gray}
        value={city}
        onChangeText={setCity}
      />
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
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card: { ...cardStyle, padding: spacing.lg, marginBottom: spacing.lg },
  section: { ...typography.section, color: colors.primary, marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.gray, marginBottom: spacing.xs },
  hint: { ...typography.bodySmall, color: colors.gray, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  value: { ...typography.body, color: colors.text, marginBottom: spacing.md },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  input: { ...inputStyle, marginBottom: spacing.md },
  button: { ...primaryButtonStyle, marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: colors.onPrimary },
});
