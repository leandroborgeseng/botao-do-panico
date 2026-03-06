'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { panicEvents, type PanicEvent } from '@/lib/api';
import EventsMap from './EventsMap';

export default function DashboardPage() {
  const [events, setEvents] = useState<PanicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    panicEvents
      .list()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const neighborhoodCounts = (() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      const raw = (ev.addressNeighborhood || '').trim();
      const key = raw || 'Sem bairro';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
    const maxBars = 12;
    if (sorted.length <= maxBars) return sorted;
    const top = sorted.slice(0, maxBars - 1);
    const others = sorted.slice(maxBars - 1).reduce((acc, [, count]) => acc + count, 0);
    return [...top, ['Outros', others] as const];
  })();

  const weekdayCounts = (() => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
    const counts = labels.map((label) => [label, 0] as [string, number]);
    for (const ev of events) {
      const d = new Date(ev.capturedAt);
      const idx = Number.isFinite(d.getTime()) ? d.getDay() : -1;
      if (idx >= 0 && idx <= 6) counts[idx][1] += 1;
    }
    return counts;
  })();

  const monthCounts = (() => {
    const map = new Map<string, number>(); // YYYY-MM -> count
    for (const ev of events) {
      const d = new Date(ev.capturedAt);
      if (!Number.isFinite(d.getTime())) continue;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const keys = Array.from(map.keys()).sort(); // chronological
    const last12 = keys.slice(Math.max(0, keys.length - 12));
    return last12.map((k) => {
      const [y, m] = k.split('-');
      const label = `${m}/${y}`;
      return [label, map.get(k) ?? 0] as [string, number];
    });
  })();

  function BarsChart({
    title,
    subtitle,
    data,
  }: {
    title: string;
    subtitle?: string;
    data: [string, number][];
  }) {
    if (data.length === 0) return null;
    const max = Math.max(...data.map(([, c]) => c), 1);
    return (
      <div
        style={{
          marginTop: 16,
          background: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          padding: 16,
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 6, fontSize: 16, color: 'var(--color-text)' }}>{title}</h3>
        {subtitle ? (
          <p style={{ margin: 0, marginBottom: 12, fontSize: 13, color: 'var(--color-gray)' }}>{subtitle}</p>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map(([name, count]) => (
            <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                style={{
                  width: 160,
                  color: 'var(--color-text)',
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 12,
                  background: 'rgba(0,0,0,0.06)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(6, Math.round((count / max) * 100))}%`,
                    height: '100%',
                    background: 'var(--color-link)',
                  }}
                />
              </div>
              <div style={{ width: 44, textAlign: 'right', color: 'var(--color-gray)', fontSize: 13 }}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 8, color: 'var(--color-primary)' }}>Dashboard</h1>
      <p style={{ color: 'var(--color-gray)', marginBottom: 32 }}>
        Botão do Pânico — Painel administrativo
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--color-text)' }}>
          Mapa de ocorrências
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-gray)', marginBottom: 12 }}>
          Todos os eventos de pânico no mapa para visualizar onde se concentram as ocorrências. Toque em um marcador para ver detalhes.
        </p>
        {error ? (
          <p style={{ color: 'var(--color-error)', marginBottom: 12 }}>{error}</p>
        ) : null}
        {loading ? (
          <div
            style={{
              height: 420,
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              background: 'var(--color-background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gray)',
            }}
          >
            Carregando mapa...
          </div>
        ) : (
          <EventsMap events={events} />
        )}
        {!loading && events.length === 0 && (
          <p style={{ marginTop: 8, color: 'var(--color-gray)', fontSize: 14 }}>
            Nenhum evento registrado ainda.
          </p>
        )}

        {!loading && events.length > 0 && (
          <>
            <BarsChart
              title="Chamados por bairro"
              subtitle="Agrupamento baseado no bairro estimado via geocodificação (eventos sem bairro aparecem como “Sem bairro”)."
              data={neighborhoodCounts as [string, number][]}
            />
            <BarsChart
              title="Chamados por dia da semana"
              subtitle="Distribuição dos eventos por dia (Dom → Sáb)."
              data={weekdayCounts}
            />
            <BarsChart
              title="Chamados por mês"
              subtitle="Últimos 12 meses (MM/AAAA)."
              data={monthCounts}
            />
          </>
        )}
      </section>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link
          href="/dashboard/events"
          style={{
            padding: 24,
            background: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            minWidth: 200,
            color: 'var(--color-text)',
          }}
        >
          <strong>Eventos de pânico</strong>
          <p style={{ fontSize: 14, color: 'var(--color-gray)', marginTop: 4 }}>
            Ver todos os eventos
          </p>
        </Link>
        <Link
          href="/dashboard/contacts"
          style={{
            padding: 24,
            background: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            minWidth: 200,
            color: 'var(--color-text)',
          }}
        >
          <strong>Meus contatos</strong>
          <p style={{ fontSize: 14, color: 'var(--color-gray)', marginTop: 4 }}>
            Gerenciar até 3 contatos
          </p>
        </Link>
      </div>
    </div>
  );
}
