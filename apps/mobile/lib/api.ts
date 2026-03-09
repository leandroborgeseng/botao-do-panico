import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearStorage, getStoredRefreshToken, setStoredToken, setStoredRefreshToken } from '@/lib/storage';
import { runUnauthorizedHandler } from '@/lib/unauthorized';

const TOKEN_KEY = '@panico_token';

// Valor vem do app.config.js (extra.apiUrl). Padrão: produção. Para dev local use EXPO_PUBLIC_API_URL no .env
const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'https://botao-do-panico-production.up.railway.app';
const DEFAULT_TIMEOUT_MS = 15000;

function getToken(): string | null {
  if (typeof global === 'undefined') return null;
  try {
    return (global as unknown as { __token?: string }).__token ?? null;
  } catch {
    return null;
  }
}

async function getTokenAsync(): Promise<string | null> {
  const fromMemory = getToken();
  if (fromMemory) return fromMemory;
  try {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      return stored;
    }
  } catch {}
  return null;
}

export function setToken(token: string | null) {
  try {
    (global as unknown as { __token?: string }).__token = token ?? undefined;
  } catch {}
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf?: string;
  supportOnly?: boolean;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface RegisterResult {
  user: User;
  notFoundCpfs?: string[];
}

export interface PanicEventReceived {
  id: string;
  userId: string;
  createdAt: string;
  status: string;
  latitude: number;
  longitude: number;
  accuracyM: number;
  capturedAt: string;
  audioUrl: string | null;
  addressStreet?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  user?: { id: string; name: string; email: string; cpf: string };
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getTokenAsync();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else {
    delete headers['Content-Type'];
  }

  let res: Response;
  const controller = new AbortController();
  const timeoutMs =
    typeof (options as { timeoutMs?: unknown }).timeoutMs === 'number'
      ? ((options as { timeoutMs?: number }).timeoutMs as number)
      : DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/aborted|aborterror/i.test(msg)) {
      throw new Error('A requisição demorou demais. Tente novamente.');
    }
    if (/network request failed|failed to fetch|network error/i.test(msg)) {
      throw new Error('Sem conexão. Tente novamente.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 && path !== '/auth/refresh') {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const data = (await refreshRes.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string };
        if (refreshRes.ok && data.access_token) {
          setToken(data.access_token);
          await setStoredToken(data.access_token);
          if (data.refresh_token) await setStoredRefreshToken(data.refresh_token);
          const newHeaders = { ...headers, Authorization: `Bearer ${data.access_token}` };
          const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers: newHeaders });
          if (retryRes.ok) {
            const text = await retryRes.text();
            return (text ? JSON.parse(text) : {}) as T;
          }
          if (retryRes.status === 401) {
            setToken(null);
            await clearStorage().catch(() => {});
            runUnauthorizedHandler();
            throw new Error('Sessão expirada. Faça login novamente.');
          }
        }
      } catch (_) {}
    }
  }
  if (res.status === 401) {
    setToken(null);
    await clearStorage().catch(() => {});
    runUnauthorizedHandler();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Erro na requisição');
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ access_token: string; refresh_token?: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    name: string;
    email: string;
    cpf: string;
    password: string;
    supportOnly?: boolean;
    contactCpfs?: string[];
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }) =>
    api<RegisterResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => api<User>('/auth/me'),
  updateMe: (data: Partial<User>) => api<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const contacts = {
  list: () =>
    api<
      {
        id: string;
        cpf: string;
        name: string;
        phone: string;
        email: string;
        contactUser?: { id: string; name: string; email: string; cpf: string };
      }[]
    >('/contacts'),
  /** Retorna apenas exists e name (para preencher formulário); não expõe id/cpf. */
  lookupByCpf: (cpf: string) =>
    api<{ exists: boolean; name?: string }>(`/contacts/lookup-by-cpf/${encodeURIComponent(cpf)}`),
  create: (data: { cpf: string; name?: string; phone?: string; email?: string }) =>
    api<unknown>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; phone?: string; email?: string }) =>
    api<unknown>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/contacts/${id}`, { method: 'DELETE' }),
};

export const deviceTokens = {
  /** Registra o token do dispositivo; o backend usa o userId do JWT (ownerType USER). */
  register: (data: { token: string; platform: 'android' | 'ios' | 'web' }) =>
    api<unknown>('/device-tokens/register', { method: 'POST', body: JSON.stringify(data) }),
};

export async function sendPanicEvent(formData: FormData): Promise<PanicEventReceived> {
  const token = await getTokenAsync();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    res = await fetch(`${API_URL}/panic-events`, { method: 'POST', headers, body: formData, signal: controller.signal });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/aborted|aborterror/i.test(msg)) {
      throw new Error('A requisição demorou demais. Tente novamente.');
    }
    if (/network request failed|failed to fetch|network error/i.test(msg)) {
      throw new Error('Sem conexão. Tente novamente.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    setToken(null);
    await clearStorage().catch(() => {});
    runUnauthorizedHandler();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Erro ao enviar');
  }
  return res.json() as Promise<PanicEventReceived>;
}

export interface NotificationStatusItem {
  contactId: string;
  contactName: string;
  contactUserId: string | null;
  received: boolean;
  readAt: string | null;
}

export const panicEvents = {
  list: () => api<unknown[]>('/panic-events'),
  received: () => api<PanicEventReceived[]>('/panic-events/received'),
  get: (id: string) => api<PanicEventReceived & { notificationLogs?: unknown[] }>(`/panic-events/${id}`),
  getNotificationStatus: (id: string) => api<NotificationStatusItem[]>(`/panic-events/${id}/notification-status`),
};
