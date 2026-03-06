import { Injectable } from '@nestjs/common';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'BotaoPanicoPrefeituraFranca/1.0 (contato@prefeitura.franca.sp.gov.br)';

export interface ReverseGeocodeResult {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

/**
 * Geocodificação reversa via Nominatim (OpenStreetMap).
 * Uso: 1 req/s; User-Agent identificável obrigatório.
 */
@Injectable()
export class GeocodingService {
  async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null> {
    try {
      const params = new URLSearchParams({
        format: 'json',
        lat: String(lat),
        lon: String(lon),
        addressdetails: '1',
        zoom: '18',
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) return null;
      const data = (await res.json()) as { address?: Record<string, string> };
      const addr = data?.address;
      if (!addr || typeof addr !== 'object') return null;

      const street =
        addr.road ??
        addr.street ??
        addr.pedestrian ??
        addr.footway ??
        addr.residential;
      const neighborhood =
        addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? addr.district;
      const city =
        addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county;
      const state = addr.state;

      if (!street && !neighborhood && !city && !state) return null;
      return {
        street: street ?? undefined,
        neighborhood: neighborhood ?? undefined,
        city: city ?? undefined,
        state: state ?? undefined,
      };
    } catch {
      return null;
    }
  }
}
