import { clearAuthCookie } from '@/lib/auth-cookie';

// Padrão: API em produção (Railway). Para dev local use NEXT_PUBLIC_API_URL=http://localhost:3001 no .env.local
// Remove barra final para evitar URLs com // (ex.: base/ + /auth/login)
const API_URL_RAW = (process.env.NEXT_PUBLIC_API_URL || 'https://botao-do-panico-production.up.railway.app').replace(/\/$/, '');
// No browser usamos /api (proxy do Next.js) para evitar CORS; no SSR usa a URL direta
const API_URL = typeof window !== 'undefined' ? '/api' : API_URL_RAW;
const DEFAULT_TIMEOUT_MS = 15000;

const LOG_PREFIX = '[API]';

const REFRESH_TOKEN_KEY = 'refresh_token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(access: string, refresh?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', access);
  if (refresh != null) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
}

export function getApiUrl(): string {
  return typeof window !== 'undefined' ? '/api' : API_URL_RAW;
}

async function doRequest<T>(
  path: string,
  options: RequestInit,
  token: string | null,
  skipRefresh = false
): Promise<Response> {
  const url = `${API_URL}${path}`;
  const headers: HeadersInit = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else {
    delete headers['Content-Type'];
  }
  const controller = new AbortController();
  const timeoutMs =
    typeof (options as { timeoutMs?: unknown }).timeoutMs === 'number'
      ? ((options as { timeoutMs?: number }).timeoutMs as number)
      : DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  if (typeof window !== 'undefined') {
    console.log(`${LOG_PREFIX} ${(options.method || 'GET')} ${url}`);
  }

  let token = getToken();
  let res = await doRequest(path, options, token, false);

  if (res.status === 401 && typeof window !== 'undefined' && path !== '/auth/refresh') {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const data = (await refreshRes.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string };
        if (refreshRes.ok && data.access_token) {
          setTokens(data.access_token, data.refresh_token);
          token = data.access_token;
          res = await doRequest(path, options, token, true);
        }
      } catch {
        // refresh falhou
      }
    }
    if (res.status === 401) {
      clearTokens();
      clearAuthCookie();
      window.location.href = '/login';
      throw new Error('Não autorizado');
    }
  }

  if (typeof window !== 'undefined' && !res.ok) {
    const clone = res.clone();
    clone.text().then((body) => {
      console.error(`${LOG_PREFIX} resposta erro:`, { url, status: res.status, statusText: res.statusText, body: body.slice(0, 500) });
    }).catch(() => {});
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      clearTokens();
      clearAuthCookie();
      window.location.href = '/login';
    }
    throw new Error('Não autorizado');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = err?.message || `Erro ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf?: string;
  active?: boolean;
  supportOnly?: boolean;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf?: string;
  createdAt?: string;
}

export interface PanicEvent {
  id: string;
  userId: string;
  createdAt: string;
  status: string;
  latitude: number;
  longitude: number;
  accuracyM: number;
  capturedAt: string;
  audioUrl: string | null;
  audioDurationS: number;
  addressStreet?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  user?: { id: string; name: string; email: string };
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string; cpf: string }) =>
    api<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/** Resposta da busca de usuário por CPF (para preencher contato; não expõe id/cpf) */
export interface LookupByCpfResult {
  exists: boolean;
  name?: string;
}

export const contacts = {
  list: () => api<EmergencyContact[]>('/contacts'),
  /** Busca se existe usuário com o CPF e retorna só o nome para preencher formulário */
  lookupByCpf: (cpf: string) =>
    api<LookupByCpfResult>(`/contacts/lookup-by-cpf/${encodeURIComponent(cpf.replace(/\D/g, ''))}`),
  create: (data: { cpf: string; name?: string; phone?: string; email?: string }) =>
    api<EmergencyContact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<EmergencyContact, 'name' | 'phone' | 'email'>>) =>
    api<EmergencyContact>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/contacts/${id}`, { method: 'DELETE' }),
};

export const users = {
  list: () => api<User[]>('/users'),
  get: (id: string) => api<User>(`/users/${id}`),
  create: (data: {
    name: string;
    email: string;
    password: string;
    cpf?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }) =>
    api<User>('/auth/register-admin', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>> & { password?: string }) =>
    api<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/users/${id}`, { method: 'DELETE' }),
};

export interface NotificationStatusItem {
  contactId: string;
  contactName: string;
  contactUserId: string | null;
  received: boolean;
  readAt: string | null;
}

export const panicEvents = {
  list: () => api<PanicEvent[]>('/panic-events'),
  /** Eventos que o usuário recebeu (como contato de emergência) */
  received: () => api<PanicEvent[]>('/panic-events/received'),
  get: (id: string) =>
    api<PanicEvent & { notificationLogs?: { success: boolean; error: string | null }[] }>(
      `/panic-events/${id}`
    ),
  getNotificationStatus: (id: string) =>
    api<NotificationStatusItem[]>(`/panic-events/${id}/notification-status`),
  close: (id: string) =>
    api<PanicEvent>(`/panic-events/${id}/close`, { method: 'POST' }),
  /** Preenche endereço nos eventos antigos que ainda não têm (apenas admin). */
  backfillAddresses: () =>
    api<{ processed: number; updated: number }>('/panic-events/backfill-addresses', {
      method: 'POST',
    }),
};
