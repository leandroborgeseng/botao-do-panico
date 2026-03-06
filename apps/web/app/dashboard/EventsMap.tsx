'use client';

import { useEffect, useRef } from 'react';
import type { PanicEvent } from '@/lib/api';

// Leaflet CSS (necessário para o mapa renderizar)
import 'leaflet/dist/leaflet.css';

const FRANCA_CENTER: [number, number] = [-20.5386, -47.4009];
const DEFAULT_ZOOM = 13;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function EventsMap({ events }: { events: PanicEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const L = require('leaflet') as typeof import('leaflet');

    // Ícone padrão quebra com webpack; usar URL absoluta
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      const map = L.map(containerRef.current).setView(FRANCA_CENTER, DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current as import('leaflet').Map;

    // Remove marcadores antigos
    (markersRef.current as { remove: () => void }[]).forEach((m) => m.remove());
    markersRef.current = [];

    if (events.length === 0) {
      map.setView(FRANCA_CENTER, DEFAULT_ZOOM);
      return;
    }

    const first = events[0];
    const bounds = L.latLngBounds(
      [first.latitude, first.longitude],
      [first.latitude, first.longitude]
    );

    events.forEach((ev) => {
      const lat = ev.latitude;
      const lon = ev.longitude;
      const date = new Date(ev.capturedAt).toLocaleString('pt-BR');
      const user = ev.user ? `${ev.user.name}` : '—';
      const status = ev.status === 'OPEN' ? 'Aberto' : 'Fechado';

      const addrParts = [ev.addressStreet, ev.addressNeighborhood, ev.addressCity].filter(Boolean) as string[];
      const addrLine = addrParts.length ? escapeHtml(addrParts.join(', ')) : null;
      const marker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(
          `<div style="min-width: 180px;">
            <strong>${escapeHtml(user)}</strong><br/>
            <small>${escapeHtml(date)}</small><br/>
            ${addrLine ? `<small>${addrLine}</small><br/>` : ''}
            <span style="color: ${ev.status === 'OPEN' ? '#c53030' : '#2e7d32'}">${escapeHtml(status)}</span><br/>
            <a href="/dashboard/events/${ev.id}" style="font-size: 12px;">Ver detalhes</a>
          </div>`
        );
      markersRef.current.push(marker);
      bounds.extend([lat, lon]);
    });

    if (events.length === 1) {
      map.setView([events[0].latitude, events[0].longitude], 15);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      (markersRef.current as { remove: () => void }[]).forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [events]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 420,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        background: '#e8e8e8',
      }}
    />
  );
}
