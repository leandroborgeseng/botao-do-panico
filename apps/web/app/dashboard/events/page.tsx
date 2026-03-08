'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { panicEvents, type PanicEvent } from '@/lib/api';

type EventWithSource = PanicEvent & { _source: 'mine' | 'received' };

function getIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const u = localStorage.getItem('user');
    return u ? (JSON.parse(u) as { role?: string }).role === 'ADMIN' : false;
  } catch {
    return false;
  }
}

export default function EventsPage() {
  const [mine, setMine] = useState<PanicEvent[]>([]);
  const [received, setReceived] = useState<PanicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{ processed: number; updated: number } | null>(null);
  const isAdmin = getIsAdmin();

  function loadEvents() {
    setLoading(true);
    setError('');
    Promise.all([panicEvents.list(), panicEvents.received()])
      .then(([list, recv]) => {
        setMine(list);
        setReceived(recv);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32, color: 'var(--color-gray)', fontSize: 14 }}>
        <p style={{ margin: 0 }}>Carregando eventos...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--color-error)', marginBottom: 12 }}>{error}</p>
        <button type="button" onClick={loadEvents} style={{ padding: '8px 16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 8 }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const all: EventWithSource[] = [
    ...mine.map((ev) => ({ ...ev, _source: 'mine' as const })),
    ...received.map((ev) => ({ ...ev, _source: 'received' as const })),
  ].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

  return (
    <div>
      <h1 style={{ marginBottom: 8, color: 'var(--color-primary)' }}>Eventos de pânico</h1>
      <p style={{ marginBottom: 24, color: 'var(--color-gray)', fontSize: 14 }}>
        Eventos que você acionou e alertas que você recebeu como contato. Ao abrir o detalhe de um alerta recebido, ele é marcado como lido.
      </p>
      {isAdmin && (
        <p style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={async () => {
              setBackfilling(true);
              setBackfillResult(null);
              try {
                const res = await panicEvents.backfillAddresses();
                setBackfillResult(res);
                loadEvents();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Erro ao preencher endereços');
              } finally {
                setBackfilling(false);
              }
            }}
            disabled={backfilling}
            style={{
              padding: '8px 16px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: backfilling ? 'not-allowed' : 'pointer',
              opacity: backfilling ? 0.7 : 1,
            }}
          >
            {backfilling ? 'Preenchendo endereços…' : 'Preencher endereços dos eventos antigos'}
          </button>
          {backfillResult && (
            <span style={{ marginLeft: 12, color: 'var(--color-gray)', fontSize: 14 }}>
              {backfillResult.processed} processados, {backfillResult.updated} atualizados.
            </span>
          )}
        </p>
      )}
      <div
        style={{
          background: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-primary)', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Tipo</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Data/Hora</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Usuário / Quem acionou</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Local</th>
              <th style={{ textAlign: 'left', padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {all.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, color: 'var(--color-gray)', fontSize: 14, textAlign: 'center' }}>
                  Nenhum evento. Você ainda não acionou o pânico e não recebeu alertas como contato.
                </td>
              </tr>
            ) : (
              all.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 12, color: 'var(--color-text)' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: ev._source === 'mine' ? 'rgba(0,91,187,0.15)' : 'rgba(0,122,204,0.15)',
                        color: ev._source === 'mine' ? 'var(--color-primary)' : 'var(--color-link)',
                        fontSize: 12,
                      }}
                    >
                      {ev._source === 'mine' ? 'Meu evento' : 'Recebido'}
                    </span>
                  </td>
                  <td style={{ padding: 12, color: 'var(--color-text)' }}>
                    {new Date(ev.capturedAt).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: 12, color: 'var(--color-text)' }}>
                    {ev.user ? `${ev.user.name} (${ev.user.email})` : '-'}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: ev.status === 'OPEN' ? 'rgba(197,48,48,0.15)' : 'rgba(46,125,50,0.15)',
                        color: ev.status === 'OPEN' ? 'var(--color-error)' : 'var(--color-success)',
                        fontSize: 12,
                      }}
                    >
                      {ev.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                  <td style={{ padding: 12, color: 'var(--color-text)' }}>
                    {ev.addressCity || ev.addressNeighborhood
                      ? [ev.addressStreet, ev.addressNeighborhood, ev.addressCity].filter(Boolean).join(', ') || `${ev.latitude.toFixed(5)}, ${ev.longitude.toFixed(5)}`
                      : `${ev.latitude.toFixed(5)}, ${ev.longitude.toFixed(5)}`}
                  </td>
                  <td style={{ padding: 12 }}>
                    <Link href={`/dashboard/events/${ev.id}`} style={{ color: 'var(--color-link)' }}>
                      {ev._source === 'received' ? 'Abrir e marcar como lido' : 'Ver detalhes'}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
