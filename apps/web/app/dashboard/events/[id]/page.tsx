'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { panicEvents, type NotificationStatusItem } from '@/lib/api';

type EventDetail = Awaited<ReturnType<typeof panicEvents.get>>;

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatusItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    panicEvents
      .get(id)
      .then((e) => {
        if (cancelled) return;
        setEvent(e);
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const user = userStr ? (JSON.parse(userStr) as { id?: string }) : null;
        if (e?.userId && user?.id && e.userId === user.id) {
          return panicEvents.getNotificationStatus(id).then((status) => {
            if (!cancelled) setNotificationStatus(status);
          });
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  async function handleClose() {
    if (!confirm('Encerrar este evento?')) return;
    setClosing(true);
    setError('');
    setSuccess('');
    try {
      await panicEvents.close(id);
      setEvent((e) => (e ? { ...e, status: 'CLOSED' } : null));
      setSuccess('Evento encerrado com sucesso.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setClosing(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text)' }}>Carregando...</p>;
  if (error) return <p style={{ color: 'var(--color-error)' }}>{error}</p>;
  if (!event) return <p style={{ color: 'var(--color-text)' }}>Evento não encontrado.</p>;

  const { latitude: lat, longitude: lon } = event;
  const delta = 0.008;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(',');
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`;
  const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  const cardStyle = {
    background: 'var(--color-background)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    padding: 24,
    marginBottom: 24,
  };

  return (
    <div>
      <Link href="/dashboard/events" style={{ marginBottom: 16, display: 'inline-block', color: 'var(--color-link)' }}>
        ← Voltar
      </Link>
      <h1 style={{ marginBottom: 24, color: 'var(--color-primary)' }}>Evento de pânico</h1>
      {success && (
        <p style={{ color: 'var(--color-success)', marginBottom: 16, padding: 12, background: 'rgba(46,125,50,0.12)', borderRadius: 8 }}>
          {success}
        </p>
      )}
      <div style={cardStyle}>
        <p style={{ color: 'var(--color-text)' }}><strong>Data/Hora:</strong> {new Date(event.capturedAt).toLocaleString('pt-BR')}</p>
        <p style={{ marginTop: 8, color: 'var(--color-text)' }}>
          <strong>Status:</strong>{' '}
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              background: event.status === 'OPEN' ? 'rgba(197,48,48,0.15)' : 'rgba(46,125,50,0.15)',
              color: event.status === 'OPEN' ? 'var(--color-error)' : 'var(--color-success)',
            }}
          >
            {event.status === 'OPEN' ? 'Aberto' : 'Fechado'}
          </span>
        </p>
        {event.user && (
          <p style={{ marginTop: 8, color: 'var(--color-text)' }}>
            <strong>Usuário:</strong> {event.user.name} — {event.user.email}
          </p>
        )}
        <p style={{ marginTop: 8, color: 'var(--color-text)' }}>
          <strong>Coordenadas:</strong> {event.latitude}, {event.longitude} (precisão ~{event.accuracyM}m)
        </p>
        {(event.addressStreet || event.addressNeighborhood || event.addressCity) && (
          <p style={{ marginTop: 8, color: 'var(--color-text)' }}>
            <strong>Local aproximado:</strong>{' '}
            {[event.addressStreet, event.addressNeighborhood, event.addressCity, event.addressState]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <p style={{ marginBottom: 8, color: 'var(--color-text)' }}><strong>Localização no mapa:</strong></p>
          <iframe
            title="Local do evento"
            src={mapEmbedUrl}
            style={{ width: '100%', height: 360, border: '1px solid var(--color-border)', borderRadius: 8 }}
          />
          <p style={{ marginTop: 8 }}>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-link)' }}>
              Abrir no Google Maps →
            </a>
          </p>
        </div>
        {event.status === 'OPEN' && (
          <button
            onClick={handleClose}
            disabled={closing}
            style={{
              marginTop: 24,
              padding: '10px 20px',
              background: 'var(--color-success)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
            }}
          >
            {closing ? 'Encerrando...' : 'Encerrar evento'}
          </button>
        )}
      </div>

      {event.audioUrl && (
        <div style={cardStyle}>
          <h2 style={{ marginBottom: 12, color: 'var(--color-text)' }}>Áudio ({event.audioDurationS ?? 30}s)</h2>
          <audio controls src={event.audioUrl} style={{ width: '100%', maxWidth: 400 }} />
        </div>
      )}

      {notificationStatus != null && notificationStatus.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ marginBottom: 12, color: 'var(--color-text)' }}>Status dos contatos</h2>
          <p style={{ fontSize: 14, color: 'var(--color-gray)', marginBottom: 16 }}>
            Quem recebeu a notificação e quem leu o alerta.
          </p>
          <ul style={{ listStyle: 'none' }}>
            {notificationStatus.map((s) => (
              <li
                key={s.contactId}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: 14,
                  color: 'var(--color-text)',
                }}
              >
                <strong>{s.contactName}</strong>
                <br />
                {s.received ? '✓ Notificação recebida' : '✗ Notificação não recebida'}
                <br />
                {s.readAt
                  ? `✓ Leu o alerta em ${new Date(s.readAt).toLocaleString('pt-BR')}`
                  : 'Aguardando leitura'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.notificationLogs && event.notificationLogs.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ marginBottom: 12, color: 'var(--color-text)' }}>Log de envio (push)</h2>
          <ul style={{ listStyle: 'none' }}>
            {event.notificationLogs.map((log, i) => (
              <li key={i} style={{ padding: '6px 0', fontSize: 14, color: 'var(--color-text)' }}>
                {log.success ? '✓ Enviada' : `✗ Erro: ${log.error || 'N/A'}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
