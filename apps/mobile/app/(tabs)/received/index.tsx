import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { panicEvents, type PanicEventReceived } from '@/lib/api';
import { colors, spacing, radius, typography, cardStyle, statusBadge, primaryButtonStyle } from '@/lib/theme';

export default function ReceivedListScreen() {
  const router = useRouter();
  const [list, setList] = useState<PanicEventReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedOnce = useRef(false);

  function load(background = false) {
    if (!background) setLoading(true);
    else setRefreshing(true);
    setError('');
    panicEvents
      .received()
      .then(setList)
      .catch((e) => {
        const msg = e?.message ?? String(e);
        const isNetwork = /rede|conexão|fetch|network|failed|timeout|internet/i.test(msg);
        setError(isNetwork ? 'Sem conexão. Verifique sua internet e tente novamente.' : msg);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  const refresh = useCallback(() => load(true), []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        load(false);
      } else {
        load(true);
      }
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && list.length === 0) {
    return (
      <View style={[styles.centered, { padding: 24 }]}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setError(''); load(false); }}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Alertas de pânico de pessoas que te cadastraram como contato de confiança. Toque em um alerta para ver o mapa e marcar como lido.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              panicEvents.get(item.id).catch(() => {});
              router.push(`/received/${item.id}`);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>
              {item.user?.name ?? 'Pessoa'} acionou o pânico
            </Text>
            <Text style={styles.cardDetail}>
              {new Date(item.capturedAt).toLocaleString('pt-BR')}
            </Text>
            {(item.addressStreet || item.addressNeighborhood || item.addressCity) ? (
              <Text style={styles.cardDetail}>
                📍 {[item.addressStreet, item.addressNeighborhood, item.addressCity].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            <View style={[styles.badge, statusBadge(item.status === 'OPEN')]}>
              <Text style={[styles.badgeText, { color: item.status === 'OPEN' ? colors.error : colors.success }]}>
                {item.status === 'OPEN' ? 'Aberto' : 'Fechado'}
              </Text>
            </View>
            <View style={styles.linkRow}>
              <Ionicons name="map" size={18} color={colors.link} style={{ marginRight: 6 }} />
              <Text style={styles.link}>Toque para ver mapa e marcar como lido</Text>
            </View>
            {item.audioUrl ? (
              <Text style={styles.cardDetail}>Toque no alerta para ouvir o áudio.</Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.gray} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>Nenhum alerta recebido ainda.</Text>
            <Text style={styles.emptyHint}>Quem te adicionar como contato verá você aqui quando acionar o pânico.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  subtitle: { ...typography.bodySmall, color: colors.gray, marginBottom: spacing.md },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  retryButton: { ...primaryButtonStyle, marginTop: spacing.md, paddingVertical: 12, paddingHorizontal: 24 },
  retryButtonText: { ...typography.button, color: colors.onPrimary },
  card: {
    ...cardStyle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.section, color: colors.text, marginBottom: spacing.xs },
  cardDetail: { ...typography.bodySmall, color: colors.gray, marginBottom: 2 },
  badge: { marginTop: 4 },
  badgeText: { ...typography.caption, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  link: { ...typography.bodySmall, color: colors.link, flex: 1 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyText: { ...typography.body, color: colors.gray, textAlign: 'center', marginBottom: spacing.xs },
  emptyHint: { ...typography.bodySmall, color: colors.gray, textAlign: 'center' },
});
