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

  function handleExportTxt() {
    if (!events.length) return;
    const lines: string[] = [];
    lines.push('Logs de eventos de pânico');
    lines.push(`Exportado em: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('='.repeat(80));
    for (const ev of events) {
      const date = new Date(ev.capturedAt).toLocaleString('pt-BR');
      const address =
        ev.addressCity || ev.addressNeighborhood || ev.addressStreet
          ? [ev.addressStreet, ev.addressNeighborhood, ev.addressCity].filter(Boolean).join(', ')
          : `${ev.latitude.toFixed(5)}, ${ev.longitude.toFixed(5)}`;
      lines.push(`ID: ${ev.id}`);
      lines.push(`Data/Hora: ${date}`);
      lines.push(`Usuário: ${ev.user?.name ?? '-'}`);
      lines.push(`E-mail: ${ev.user?.email ?? '-'}`);
      lines.push(`Local: ${address}`);
      lines.push(`Status: ${ev.status === 'OPEN' ? 'Aberto' : 'Fechado'}`);
      lines.push('-'.repeat(80));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-panico-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 style={{ color: 'var(--color-primary)' }}>Logs / Auditoria</h1>
        <button
          type="button"
          onClick={handleExportTxt}
          disabled={!events.length}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid var(--color-border)',
            background: events.length ? 'var(--color-primary)' : 'rgba(0,0,0,0.03)',
            color: events.length ? '#ffffff' : 'var(--color-gray)',
            fontSize: 13,
            cursor: events.length ? 'pointer' : 'not-allowed',
          }}
        >
          Exportar TXT
        </button>
      </div>
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

