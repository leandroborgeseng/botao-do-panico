/** Cookie usado pelo middleware para proteger /dashboard (apenas indica que há sessão). */
const AUTH_COOKIE = 'panico_auth';
const MAX_AGE_DAYS = 7;

export function setAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}
