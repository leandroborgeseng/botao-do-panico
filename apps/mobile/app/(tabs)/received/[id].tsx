import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { Audio } from 'expo-av';
import { panicEvents, type PanicEventReceived } from '@/lib/api';
import { colors, spacing, radius, typography, cardStyle, statusBadge } from '@/lib/theme';

export default function ReceivedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<PanicEventReceived | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('ID do evento não informado.');
      return;
    }
    panicEvents
      .get(id)
      .then(setEvent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  async function handleToggleAudio() {
    if (!event?.audioUrl) return;
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        return;
      }
      setAudioLoading(true);
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: event.audioUrl });
      soundRef.current = sound;
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
      await sound.playAsync();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível reproduzir o áudio.');
      setIsPlaying(false);
    } finally {
      setAudioLoading(false);
    }
  }

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
        {typeof id === 'string' && (
          <TouchableOpacity
            style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: radius.md }}
            onPress={() => {
              setError('');
              setLoading(true);
              panicEvents.get(id).then(setEvent).catch((e) => setError(e.message)).finally(() => setLoading(false));
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const mapUrl = `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;
  const region = {
    latitude: event.latitude,
    longitude: event.longitude,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={{ latitude: event.latitude, longitude: event.longitude }}
          title="Local do alerta"
          description={`${event.user?.name ?? 'Pessoa'} acionou o pânico`}
        />
      </MapView>
      <View style={styles.info}>
        <Text style={styles.title}>{event.user?.name ?? 'Pessoa'} acionou o pânico</Text>
        <Text style={styles.detail}>{new Date(event.capturedAt).toLocaleString('pt-BR')}</Text>
        {(event.addressStreet || event.addressNeighborhood || event.addressCity) ? (
          <Text style={styles.address}>
            📍 {[event.addressStreet, event.addressNeighborhood, event.addressCity, event.addressState].filter(Boolean).join(', ')}
          </Text>
        ) : null}
        <View style={[styles.badgeWrap, statusBadge(event.status === 'OPEN')]}>
          <Text style={[styles.badgeText, { color: event.status === 'OPEN' ? colors.error : colors.success }]}>
            {event.status === 'OPEN' ? 'Aberto' : 'Fechado'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL(mapUrl)}
        >
          <Text style={styles.linkText}>Abrir no Google Maps</Text>
        </TouchableOpacity>
        {event.audioUrl ? (
          <TouchableOpacity
            style={styles.audioButton}
            onPress={handleToggleAudio}
            disabled={audioLoading}
          >
            <Text style={styles.audioButtonText}>
              {audioLoading
                ? 'Carregando áudio...'
                : isPlaying
                ? 'Parar áudio'
                : 'Ouvir áudio do evento'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  map: { width: '100%', height: '55%', minHeight: 280 },
  info: {
    ...cardStyle,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
  },
  title: { ...typography.section, color: colors.text, marginBottom: spacing.sm },
  detail: { ...typography.bodySmall, color: colors.gray, marginBottom: spacing.xs },
  address: { ...typography.bodySmall, color: colors.text, marginTop: spacing.xs, marginBottom: spacing.sm },
  badgeWrap: { marginTop: spacing.sm, marginBottom: spacing.sm },
  badgeText: { ...typography.caption, fontWeight: '600' },
  linkButton: { marginTop: spacing.md },
  linkText: { ...typography.body, color: colors.link, fontWeight: '600' },
  audioButton: {
    marginTop: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  audioButtonText: {
    ...typography.button,
    color: colors.onPrimary,
  },
  error: { ...typography.body, color: colors.error, textAlign: 'center' },
});
