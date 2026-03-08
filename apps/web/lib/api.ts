import { clearAuthCookie } from '@/lib/auth-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT_MS = 15000;

const LOG_PREFIX = '[API]';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getApiUrl(): string {
  return API_URL;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  if (typeof window !== 'undefined') {
    console.log(`${LOG_PREFIX} ${(options.method || 'GET')} ${url}`);
  }

  const token = getToken();
  const headers: HeadersInit = {
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
    res = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (e) {
    const err = e as Error & { cause?: unknown };
    const msg = err?.message ?? String(e);
    if (typeof window !== 'undefined') {
      console.error(`${LOG_PREFIX} fetch falhou:`, {
        url,
        method: options.method || 'GET',
        errorName: err?.name,
        errorMessage: msg,
        cause: err?.cause,
      });
    }
    if (/aborted|aborterror/i.test(msg)) {
      throw new Error('A requisição demorou demais. Tente novamente.');
    }
    if (/failed to fetch|networkerror|network error|load failed/i.test(msg)) {
      throw new Error(
        `Não foi possível conectar ao servidor. Verifique se o backend está rodando e se a URL da API está correta (NEXT_PUBLIC_API_URL). Valor usado: ${API_URL}`
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (typeof window !== 'undefined' && !res.ok) {
    const clone = res.clone();
    clone.text().then((body) => {
      console.error(`${LOG_PREFIX} resposta erro:`, { url, status: res.status, statusText: res.statusText, body: body.slice(0, 500) });
    }).catch(() => {});
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
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
    api<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string; cpf: string }) =>
    api<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/** Resposta da busca de usuário por CPF (para preencher contato) */
export interface LookupByCpfResult {
  id: string;
  name: string;
  cpf: string;
}

export const contacts = {
  list: () => api<EmergencyContact[]>('/contacts'),
  /** Busca usuário por CPF (para preencher nome/e-mail ao adicionar contato) */
  lookupByCpf: (cpf: string) =>
    api<LookupByCpfResult | null>(`/contacts/lookup-by-cpf/${encodeURIComponent(cpf.replace(/\D/g, ''))}`),
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
