import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { panicEvents, type PanicEventReceived } from '@/lib/api';
import { colors, spacing, radius, typography, cardStyle } from '@/lib/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<PanicEventReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(background = false) {
    if (!background) setLoading(true);
    else setRefreshing(true);
    try {
      const list = await panicEvents.list();
      setEvents(list as PanicEventReceived[]);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Você ainda não acionou o botão do pânico.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const hasAddress = item.addressNeighborhood || item.addressCity || item.addressStreet;
          const address = hasAddress
            ? [item.addressStreet, item.addressNeighborhood, item.addressCity].filter(Boolean).join(', ')
            : `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`;
          const date = new Date(item.capturedAt).toLocaleString('pt-BR');
          const hasAudio = !!item.audioUrl;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/history/[id]',
                  params: { id: item.id },
                })
              }
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text style={styles.cardTitle}>{item.status === 'OPEN' ? 'Chamado aberto' : 'Chamado encerrado'}</Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: item.status === 'OPEN' ? 'rgba(197,48,48,0.12)' : 'rgba(46,125,50,0.12)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: item.status === 'OPEN' ? colors.error : colors.success },
                    ]}
                  >
                    {item.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{date}</Text>
              <Text style={styles.cardMeta}>📍 {address}</Text>
              {hasAudio && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                  <Ionicons name="volume-high-outline" size={16} color={colors.gray} style={{ marginRight: 4 }} />
                  <Text style={styles.cardMeta}>Com gravação de áudio</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  card: {
    ...cardStyle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.section, color: colors.text },
  cardMeta: { ...typography.bodySmall, color: colors.gray, marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: { ...typography.caption, fontWeight: '600' },
  emptyBox: {
    ...cardStyle,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { ...typography.bodySmall, color: colors.gray, textAlign: 'center' },
});

