import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPanicEvent, panicEvents, type NotificationStatusItem, type PanicEventReceived } from '@/lib/api';
import { requestLocationPermission, requestMicrophonePermission } from '@/lib/permissions';
import { colors, spacing, radius, typography, cardStyle, shadows } from '@/lib/theme';
import { useFocusEffect } from 'expo-router';
import { getDisguiseMode, subscribeDisguiseMode } from '@/lib/settings';

const COUNTDOWN_SECONDS = 3;
const RECORD_SECONDS = 30;

export default function PanicScreen() {
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'recording' | 'sending' | 'status'>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(RECORD_SECONDS);
  const [statusList, setStatusList] = useState<NotificationStatusItem[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<PanicEventReceived | null>(null);
  const [eventStatus, setEventStatus] = useState<'OPEN' | 'CLOSED' | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const uriRef = useRef<string | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [disguiseMode, setDisguiseMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDisguiseMode().then(setDisguiseMode).catch(() => {});
      const unsub = subscribeDisguiseMode(setDisguiseMode);
      return () => unsub();
    }, []),
  );

  // Atualiza status dos contatos e do evento a cada 5s (reflete leitura/encerramento feitos na web)
  useEffect(() => {
    if (phase !== 'status' || !lastEventId) return;
    const poll = async () => {
      try {
        const [status, event] = await Promise.all([
          panicEvents.getNotificationStatus(lastEventId),
          panicEvents.get(lastEventId),
        ]);
        setStatusList(status);
        if (event) setLastEvent(event);
        setEventStatus(event?.status === 'CLOSED' ? 'CLOSED' : 'OPEN');
        if (event?.status === 'CLOSED' && statusPollRef.current) {
          clearInterval(statusPollRef.current);
          statusPollRef.current = null;
        }
      } catch {
        // ignora erro de rede no polling
      }
    };
    poll();
    statusPollRef.current = setInterval(poll, 5000);
    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
        statusPollRef.current = null;
      }
    };
  }, [phase, lastEventId]);

  const cancelConfirm = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setPhase('idle');
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  const startCountdown = useCallback(() => {
    setPhase('confirm');
    setCountdown(COUNTDOWN_SECONDS);
    let left = COUNTDOWN_SECONDS;
    countdownRef.current = setInterval(() => {
      left -= 1;
      setCountdown(left);
      if (left <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        triggerPanic();
      }
    }, 1000);
  }, []);

  async function triggerPanic() {
    setPhase('recording');
    setRecordSecondsLeft(RECORD_SECONDS);

    try {
      const locOk = await requestLocationPermission();
      if (!locOk) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da localização para enviar em caso de emergência.',
          [
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
            { text: 'Cancelar', style: 'cancel', onPress: () => setPhase('idle') },
          ]
        );
        return;
      }

      const micOk = await requestMicrophonePermission();
      if (!micOk) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos do microfone para gravar áudio.',
          [
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
            { text: 'Cancelar', style: 'cancel', onPress: () => setPhase('idle') },
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const accuracy = location.coords.accuracy ?? 0;
      const capturedAt = new Date().toISOString();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      let secLeft = RECORD_SECONDS;
      setRecordSecondsLeft(secLeft);
      recordRef.current = setInterval(() => {
        secLeft -= 1;
        setRecordSecondsLeft(secLeft);
        if (secLeft <= 0 && recordRef.current) {
          clearInterval(recordRef.current);
          recordRef.current = null;
        }
      }, 1000);

      await new Promise((r) => setTimeout(r, RECORD_SECONDS * 1000));

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (recordRef.current) {
        clearInterval(recordRef.current);
        recordRef.current = null;
      }
      uriRef.current = uri;

      setPhase('sending');

      const formData = new FormData();
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('accuracy_m', String(accuracy));
      formData.append('captured_at', capturedAt);
      if (uri) {
        const name = uri.split('/').pop() || 'audio.m4a';
        formData.append('audio', {
          uri,
          name,
          type: 'audio/m4a',
        } as unknown as Blob);
      }

      const event = await sendPanicEvent(formData);
      setLastEventId(event.id);
      AsyncStorage.setItem('@panico_last_event_id', event.id).catch(() => {});
      setEventStatus('OPEN');
      setStatusLoading(true);
      setPhase('status');
      try {
        const [status, ev] = await Promise.all([
          panicEvents.getNotificationStatus(event.id),
          panicEvents.get(event.id),
        ]);
        setStatusList(status);
        setEventStatus(ev?.status === 'CLOSED' ? 'CLOSED' : 'OPEN');
      } catch {
        setStatusList([]);
      } finally {
        setStatusLoading(false);
      }
    } catch (err: unknown) {
      setPhase('idle');
      Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao enviar evento.');
    }
  }

  async function refreshStatus() {
    if (!lastEventId) return;
    setStatusLoading(true);
    try {
      const [status, ev] = await Promise.all([
        panicEvents.getNotificationStatus(lastEventId),
        panicEvents.get(lastEventId),
      ]);
      setStatusList(status);
      if (ev) setLastEvent(ev);
      setEventStatus(ev?.status === 'CLOSED' ? 'CLOSED' : 'OPEN');
    } finally {
      setStatusLoading(false);
    }
  }

  function closeStatus() {
    setPhase('idle');
    setLastEventId(null);
    setLastEvent(null);
    setEventStatus(null);
    setStatusList([]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{disguiseMode ? 'Pedidos rápidos' : 'Botão do Pânico'}</Text>
      <Text style={styles.subtitle}>
        {disguiseMode
          ? 'Faça um pedido rápido. Se precisar cancelar, você terá 3 segundos após confirmar.'
          : 'Em caso de emergência, pressione o botão. Você terá 3 segundos para cancelar.'}
      </Text>

      {phase === 'idle' && (
        disguiseMode ? (
          <View style={styles.fakeCard}>
            <Text style={styles.fakeTitle}>Pizzaria Express</Text>
            <Text style={styles.fakeHint}>Escolha uma opção e confirme seu pedido.</Text>
            <View style={styles.fakeRow}>
              <View style={styles.fakeChip}><Text style={styles.fakeChipText}>🍕 Calabresa</Text></View>
              <View style={styles.fakeChip}><Text style={styles.fakeChipText}>🍕 Mussarela</Text></View>
              <View style={styles.fakeChip}><Text style={styles.fakeChipText}>🥤 Refrigerante</Text></View>
            </View>
            <TouchableOpacity style={styles.fakeButton} onPress={startCountdown} activeOpacity={0.85}>
              <Ionicons name="cart" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.fakeButtonText}>Confirmar pedido</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.panicButton}
            onPress={startCountdown}
            activeOpacity={0.8}
          >
            <Text style={styles.panicButtonText}>PÂNICO</Text>
          </TouchableOpacity>
        )
      )}

      {phase === 'confirm' && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>{disguiseMode ? 'Cancelar pedido?' : 'Cancelar?'}</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelConfirm}>
            <Text style={styles.cancelButtonText}>{disguiseMode ? 'CANCELAR PEDIDO' : 'CANCELAR'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'recording' && (
        <View style={styles.recordingBox}>
          <Text style={styles.recordingTitle}>{disguiseMode ? 'Preparando seu pedido...' : 'Gravando áudio...'}</Text>
          <Text style={styles.recordCountdown}>
            {disguiseMode ? `Aguardando: ${recordSecondsLeft}s` : `${recordSecondsLeft}s`}
          </Text>
        </View>
      )}

      {phase === 'sending' && (
        <View style={styles.sendingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.sendingText}>{disguiseMode ? 'Enviando pedido...' : 'Enviando...'}</Text>
        </View>
      )}

      {phase === 'status' && (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>{disguiseMode ? 'Status do pedido' : 'Status dos contatos'}</Text>
          <Text style={styles.statusSubtitle}>
            {disguiseMode ? 'Acompanhe as atualizações do seu pedido' : 'Quem recebeu e quem leu o alerta'}
          </Text>
          {eventStatus === 'CLOSED' && (
            <View style={styles.eventClosedBadge}>
              <Ionicons name="checkmark-done-circle" size={20} color={colors.success} style={{ marginRight: 6 }} />
              <Text style={styles.eventClosedText}>{disguiseMode ? 'Pedido finalizado' : 'Evento encerrado'}</Text>
            </View>
          )}
          {lastEvent && (lastEvent.addressStreet || lastEvent.addressNeighborhood || lastEvent.addressCity) ? (
            <Text style={styles.statusAddress}>
              {disguiseMode ? '📍 Endereço confirmado' : '📍 '}
              {!disguiseMode
                ? [lastEvent.addressStreet, lastEvent.addressNeighborhood, lastEvent.addressCity].filter(Boolean).join(', ')
                : ''}
            </Text>
          ) : null}
          <Text style={styles.statusPollHint}>
            {disguiseMode ? 'Atualização automática a cada 5 segundos' : 'Atualização automática a cada 5 segundos'}
          </Text>
          {statusLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <ScrollView style={styles.statusScroll} showsVerticalScrollIndicator={false}>
              {statusList.length === 0 ? (
                <Text style={styles.statusEmpty}>{disguiseMode ? 'Aguardando atualizações...' : 'Nenhum contato cadastrado.'}</Text>
              ) : (
                statusList.map((s, idx) => (
                  <View key={s.contactId} style={styles.statusCard}>
                    <Text style={styles.statusCardName}>{disguiseMode ? `Atualização ${idx + 1}` : s.contactName}</Text>
                    <Text style={styles.statusRow}>
                      {s.received
                        ? disguiseMode
                          ? '✓ Pedido recebido'
                          : '✓ Notificação recebida'
                        : disguiseMode
                          ? '⏳ Aguardando confirmação'
                          : '✗ Notificação não recebida'}
                    </Text>
                    <Text style={styles.statusRow}>
                      {s.readAt
                        ? disguiseMode
                          ? `✓ Atualizado às ${new Date(s.readAt).toLocaleTimeString('pt-BR')}`
                          : `✓ Leu o alerta às ${new Date(s.readAt).toLocaleTimeString('pt-BR')}`
                        : disguiseMode
                          ? 'Em preparação'
                          : 'Aguardando leitura'}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.statusRefresh} onPress={refreshStatus} disabled={statusLoading}>
            <Ionicons name="refresh" size={20} color={colors.link} style={{ marginRight: 6 }} />
            <Text style={styles.statusRefreshText}>{disguiseMode ? 'Atualizar status' : 'Atualizar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusDone} onPress={closeStatus}>
            <Ionicons name="checkmark-done" size={22} color={colors.onPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.statusDoneText}>{disguiseMode ? 'Fechar' : 'Concluído'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    ...typography.titleSmall,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: spacing.md,
  },
  panicButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.panic,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.panic,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  panicButtonText: {
    color: colors.onPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  fakeCard: {
    width: '100%',
    maxWidth: 340,
    ...cardStyle,
    padding: spacing.lg,
  },
  fakeTitle: { ...typography.section, color: colors.text, marginBottom: spacing.xs },
  fakeHint: { ...typography.bodySmall, color: colors.gray, marginBottom: spacing.md },
  fakeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  fakeChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,91,187,0.10)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fakeChipText: { ...typography.bodySmall, color: colors.text },
  fakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...shadows.button,
  },
  fakeButtonText: { ...typography.button, color: colors.onPrimary },
  confirmBox: { alignItems: 'center' },
  confirmTitle: { ...typography.section, color: colors.text, marginBottom: spacing.md },
  countdown: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.error,
    marginBottom: spacing.lg,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
  cancelButtonText: { ...typography.button, color: colors.text },
  recordingBox: { alignItems: 'center' },
  recordingTitle: { ...typography.section, color: colors.text, marginBottom: spacing.sm },
  recordCountdown: { fontSize: 36, fontWeight: '700', color: colors.primary },
  sendingBox: { alignItems: 'center' },
  sendingText: { marginTop: spacing.md, ...typography.body, color: colors.gray },
  statusBox: {
    width: '100%',
    maxWidth: 340,
    ...cardStyle,
    padding: spacing.lg,
  },
  statusTitle: { ...typography.section, color: colors.text, marginBottom: spacing.xs },
  statusSubtitle: { ...typography.bodySmall, color: colors.gray, marginBottom: spacing.xs },
  eventClosedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,125,50,0.12)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  eventClosedText: { ...typography.bodySmall, fontWeight: '600', color: colors.success },
  statusAddress: { ...typography.bodySmall, color: colors.text, marginBottom: spacing.sm },
  statusPollHint: { ...typography.caption, color: colors.gray, marginBottom: spacing.md, fontStyle: 'italic' },
  statusScroll: { maxHeight: 220, marginBottom: spacing.md },
  statusEmpty: { ...typography.bodySmall, color: colors.gray, textAlign: 'center', paddingVertical: spacing.md },
  statusCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  statusCardName: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 6 },
  statusRow: { ...typography.bodySmall, color: colors.gray, marginBottom: 2 },
  statusRefresh: {
    flexDirection: 'row',
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statusRefreshText: { ...typography.bodySmall, color: colors.link },
  statusDone: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  statusDoneText: { ...typography.button, color: colors.onPrimary },
});
