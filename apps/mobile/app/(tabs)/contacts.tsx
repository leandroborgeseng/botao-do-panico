import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, contacts as contactsApi, setToken, panicEvents, type NotificationStatusItem } from '@/lib/api';
import { clearStorage } from '@/lib/storage';
import { colors, spacing, radius, typography, cardStyle, primaryButtonStyle } from '@/lib/theme';

function stripDigits(s: string) {
  return s.replace(/\D/g, '');
}

type Contact = {
  id: string;
  cpf: string;
  name: string;
  phone: string;
  email: string;
  contactUser?: { id: string; name: string; email: string; cpf: string };
};

export default function ContactsScreen() {
  const router = useRouter();
  const [supportOnly, setSupportOnly] = useState<boolean | null>(null);
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [cpfInput, setCpfInput] = useState('');
  const [lookupUser, setLookupUser] = useState<{ id: string; name: string; cpf: string } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [statusByContact, setStatusByContact] = useState<Record<string, NotificationStatusItem | undefined>>({});
  const [hasStatus, setHasStatus] = useState(false);

  function load(background = false) {
    if (!background) setLoading(true);
    else setRefreshing(true);
    Promise.all([auth.me(), contactsApi.list()])
      .then(([user, contacts]) => {
        setSupportOnly(user.supportOnly ?? false);
        setList(contacts);
      })
      .catch((e) => setError(e.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  async function loadNotificationStatus() {
    try {
      const lastId = await AsyncStorage.getItem('@panico_last_event_id');
      if (!lastId) {
        setStatusByContact({});
        setHasStatus(false);
        return;
      }
      const items = await panicEvents.getNotificationStatus(lastId);
      const map: Record<string, NotificationStatusItem> = {};
      for (const s of items) {
        map[s.contactId] = s;
      }
      setStatusByContact(map);
      setHasStatus(true);
    } catch {
      setHasStatus(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        load(false);
      } else {
        load(true);
      }
      loadNotificationStatus();
    }, []),
  );

  function openAdd() {
    setCpfInput('');
    setLookupUser(null);
    setError('');
    setModalVisible(true);
  }

  function handleCpfChange(text: string) {
    const d = stripDigits(text).slice(0, 11);
    if (d.length <= 3) setCpfInput(d);
    else if (d.length <= 6) setCpfInput(`${d.slice(0, 3)}.${d.slice(3)}`);
    else if (d.length <= 9) setCpfInput(`${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`);
    else setCpfInput(`${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`);
  }

  async function handleLookup() {
    const digits = stripDigits(cpfInput);
    if (digits.length !== 11) {
      setError('Informe um CPF com 11 dígitos.');
      return;
    }
    setLookupLoading(true);
    setError('');
    setLookupUser(null);
    try {
      const data = await contactsApi.lookupByCpf(digits);
      if (data) {
        setLookupUser(data);
      } else {
        setError('Nenhum usuário encontrado com este CPF. A pessoa precisa estar cadastrada no app.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar');
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleAddContact() {
    if (!lookupUser) return;
    const digits = stripDigits(cpfInput);
    setSaving(true);
    setError('');
    try {
      await contactsApi.create({
        cpf: digits,
        name: lookupUser.name,
      });
      setModalVisible(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao adicionar');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(c: Contact) {
    Alert.alert('Remover contato', `Remover ${c.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await contactsApi.delete(c.id);
            load();
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erro');
          }
        },
      },
    ]);
  }

  async function logout() {
    setToken(null);
    await clearStorage();
    router.replace('/login');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && list.length === 0 && supportOnly !== true) {
    return (
      <View style={[styles.centered, { padding: 24 }]}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setError(''); load(); }}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (supportOnly === true) {
    return (
      <View style={styles.container}>
        <View style={styles.supportOnlyCard}>
          <Ionicons name="people-outline" size={56} color={colors.primary} style={{ marginBottom: spacing.md, opacity: 0.9 }} />
          <Text style={styles.supportOnlyTitle}>Você é apenas contato de apoio</Text>
          <Text style={styles.supportOnlyText}>
            Você não cadastra contatos de emergência. Você receberá alertas de quem te adicionar como contato.
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.link} style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maxContacts = 3;
  const totalContacts = list.length;
  const remainingContacts = Math.max(0, maxContacts - totalContacts);

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.counterText}>
          {totalContacts} de {maxContacts} contatos de emergência cadastrados
        </Text>
        <View style={styles.progressRow}>
          {Array.from({ length: maxContacts }).map((_, idx) => {
            const filled = idx < totalContacts;
            return (
              <View
                key={idx}
                style={[
                  styles.progressStep,
                  filled ? styles.progressStepFilled : styles.progressStepEmpty,
                ]}
              />
            );
          })}
        </View>
        {remainingContacts > 0 ? (
          <Text style={styles.subtitle}>
            Cadastre mais {remainingContacts} contato{remainingContacts > 1 ? 's' : ''} de confiança. Eles
            receberão alerta imediato quando você acionar o pânico.
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            Você já cadastrou os 3 contatos. Eles serão avisados sempre que você acionar o pânico.
          </Text>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {list.length < 3 && (
        <TouchableOpacity style={styles.addButton} onPress={openAdd}>
          <Ionicons name="person-add" size={22} color={colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Adicionar por CPF</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDetail}>CPF: ***.{item.cpf.slice(-2)}</Text>
            <Text style={styles.cardDetail}>{item.email}</Text>
            {hasStatus && statusByContact[item.id] && (
              <>
                <Text style={styles.cardDetail}>
                  Último chamado:{' '}
                  {statusByContact[item.id]?.received ? 'notificação entregue' : 'não entregue'}
                </Text>
                <Text style={styles.cardDetail}>
                  {statusByContact[item.id]?.readAt
                    ? `Leitura confirmada às ${new Date(
                        statusByContact[item.id]!.readAt!,
                      ).toLocaleTimeString('pt-BR')}`
                    : 'Aguardando leitura'}
                </Text>
              </>
            )}
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={18} color={colors.error} style={{ marginRight: 4 }} />
                <Text style={styles.linkDanger}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.link} style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar contato por CPF</Text>
            <Text style={styles.modalHint}>A pessoa precisa estar cadastrada no app.</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor={colors.gray}
              value={cpfInput}
              onChangeText={handleCpfChange}
              keyboardType="number-pad"
              maxLength={14}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!lookupUser ? (
              <TouchableOpacity
                style={[styles.buttonSecondary, styles.buttonWithIcon]}
                onPress={handleLookup}
                disabled={lookupLoading || stripDigits(cpfInput).length !== 11}
              >
                <Ionicons name="search" size={20} color={colors.link} style={{ marginRight: 8 }} />
                <Text style={styles.buttonSecondaryText}>
                  {lookupLoading ? 'Buscando...' : 'Buscar'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.foundBox}>
                  <Text style={styles.foundName}>{lookupUser.name}</Text>
                  <Text style={styles.foundEmail}>CPF: {lookupUser.cpf}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, styles.buttonWithIcon]}
                  onPress={handleAddContact}
                  disabled={saving}
                >
                  <Ionicons name="person-add" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>
                    {saving ? 'Adicionando...' : 'Adicionar como contato'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.buttonSecondary, styles.buttonWithIcon]}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={20} color={colors.link} style={{ marginRight: 8 }} />
              <Text style={styles.buttonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerBox: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  progressStep: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressStepFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressStepEmpty: {
    backgroundColor: 'rgba(0,91,187,0.12)',
  },
  subtitle: { ...typography.bodySmall, color: colors.gray },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  supportOnlyCard: {
    ...cardStyle,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cardBg,
  },
  supportOnlyTitle: { ...typography.section, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  supportOnlyText: { ...typography.bodySmall, color: colors.gray, textAlign: 'center', lineHeight: 22 },
  addButton: {
    flexDirection: 'row',
    ...primaryButtonStyle,
    padding: 14,
    marginBottom: spacing.lg,
  },
  addButtonText: { ...typography.button, color: colors.onPrimary },
  buttonWithIcon: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  removeButton: { flexDirection: 'row', alignItems: 'center' },
  card: { ...cardStyle, padding: spacing.md, marginBottom: spacing.md },
  cardName: { ...typography.section, color: colors.text, marginBottom: spacing.xs },
  cardDetail: { ...typography.bodySmall, color: colors.gray, marginBottom: 2 },
  cardActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  linkDanger: { color: colors.error },
  logoutButton: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutButtonText: { ...typography.body, color: colors.link, fontWeight: '600' },
  retryButton: { ...primaryButtonStyle, marginTop: spacing.md, paddingVertical: 12, paddingHorizontal: 24 },
  retryButtonText: { ...typography.button, color: colors.onPrimary },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.lg,
  },
  modalContent: { ...cardStyle, padding: spacing.lg },
  modalTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
  modalHint: { ...typography.caption, color: colors.gray, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 14,
    color: colors.text,
    marginBottom: spacing.md,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  button: {
    padding: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPrimary: { backgroundColor: colors.primary, borderWidth: 0 },
  buttonText: { ...typography.button, color: colors.onPrimary },
  buttonSecondary: {
    padding: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: { ...typography.body, color: colors.link, fontWeight: '600' },
  foundBox: {
    backgroundColor: colors.cardBg,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  foundName: { ...typography.body, fontWeight: '600', color: colors.text },
  foundEmail: { ...typography.bodySmall, color: colors.gray },
});
