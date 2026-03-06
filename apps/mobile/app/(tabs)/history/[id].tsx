import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { panicEvents, type PanicEventReceived, type NotificationStatusItem } from '@/lib/api';
import { colors, spacing, radius, typography, cardStyle } from '@/lib/theme';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const router = useRouter();
  const [event, setEvent] = useState<PanicEventReceived | null>(null);
  const [statusList, setStatusList] = useState<NotificationStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID do evento não informado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([panicEvents.get(id), panicEvents.getNotificationStatus(id)])
      .then(([ev, status]) => {
        setEvent(ev);
        setStatusList(status);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar detalhes.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Evento não encontrado.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const address =
    event.addressStreet || event.addressNeighborhood || event.addressCity
      ? [event.addressStreet, event.addressNeighborhood, event.addressCity].filter(Boolean).join(', ')
      : `${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)}`;

  const date = new Date(event.capturedAt).toLocaleString('pt-BR');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.card}>
        <Text style={styles.title}>Detalhes do chamado</Text>
        <Text style={styles.meta}>{date}</Text>
        <Text style={styles.meta}>📍 {address}</Text>
        {event.audioUrl ? (
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => {
              Alert.alert(
                'Áudio do chamado',
                'A reprodução do áudio deste chamado está disponível na versão atual do app na tela principal de recebimento. Podemos estender este player para cá em uma próxima iteração.',
              );
            }}
          >
            <Ionicons name="volume-high-outline" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.audioButtonText}>Ouvir gravação (em breve)</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notificações para contatos</Text>
        {statusList.length === 0 ? (
          <Text style={styles.meta}>Nenhum contato cadastrado para este chamado.</Text>
        ) : (
          statusList.map((s) => {
            const delivered = s.received;
            const read = !!s.readAt;
            return (
              <View key={s.contactId} style={styles.statusCard}>
                <Text style={styles.statusName}>{s.contactName}</Text>
                <Text style={styles.statusLine}>
                  {delivered ? '✓ Notificação entregue' : 'Sem informação de entrega'}
                </Text>
                <Text style={styles.statusLine}>
                  {read
                    ? `Leu o alerta às ${new Date(s.readAt!).toLocaleTimeString('pt-BR')}`
                    : 'Aguardando leitura'}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: { ...typography.body, color: colors.link, fontWeight: '600' },
  card: { ...cardStyle, padding: spacing.lg, marginBottom: spacing.lg },
  title: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
  sectionTitle: { ...typography.section, color: colors.text, marginBottom: spacing.sm },
  meta: { ...typography.bodySmall, color: colors.gray, marginTop: 2 },
  audioButton: {
    marginTop: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonText: { ...typography.button, color: colors.onPrimary },
  statusCard: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusName: { ...typography.body, color: colors.text, marginBottom: 2 },
  statusLine: { ...typography.bodySmall, color: colors.gray },
});

