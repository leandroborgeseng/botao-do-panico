'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { panicEvents, type PanicEvent } from '@/lib/api';

export default function LogsPage() {
  const [events, setEvents] = useState<PanicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    panicEvents
      .list()
      .then((list) => {
        setEvents(list);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--color-text)' }}>Carregando logs...</p>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: 8, color: 'var(--color-primary)' }}>Logs / Auditoria</h1>
      <p style={{ color: 'var(--color-gray)', marginBottom: 24, fontSize: 14 }}>
        Visão consolidada dos eventos de pânico para auditoria e relatórios. Use os links para abrir o detalhe completo do evento.
      </p>
      {error && (
        <p style={{ color: 'var(--color-error)', marginBottom: 16 }}>
          {error}
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: 10 }}>ID</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Data/Hora</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Usuário (quem acionou)</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Local</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: 'var(--color-gray)' }}>
                  Nenhum evento registrado.
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const date = new Date(ev.capturedAt).toLocaleString('pt-BR');
                const address = ev.addressCity || ev.addressNeighborhood || ev.addressStreet
                  ? [ev.addressStreet, ev.addressNeighborhood, ev.addressCity].filter(Boolean).join(', ')
                  : `${ev.latitude.toFixed(5)}, ${ev.longitude.toFixed(5)}`;
                return (
                  <tr key={ev.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 10, fontFamily: 'monospace' }}>{ev.id.slice(0, 8)}…</td>
                    <td style={{ padding: 10 }}>{date}</td>
                    <td style={{ padding: 10 }}>
                      {ev.user ? (
                        <>
                          <span>{ev.user.name}</span>
                          <br />
                          <span style={{ color: 'var(--color-gray)' }}>{ev.user.email}</span>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: 10 }}>{address}</td>
                    <td style={{ padding: 10 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          background:
                            ev.status === 'OPEN' ? 'rgba(197,48,48,0.12)' : 'rgba(46,125,50,0.12)',
                          color: ev.status === 'OPEN' ? 'var(--color-error)' : 'var(--color-success)',
                          fontSize: 12,
                        }}
                      >
                        {ev.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <Link href={`/dashboard/events/${ev.id}`} style={{ color: 'var(--color-link)' }}>
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

