/**
 * Handler chamado quando a API retorna 401 (não autorizado).
 * O root layout registra o redirect para /login para manter a navegação centralizada.
 */
let handler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  handler = fn;
}

export function runUnauthorizedHandler() {
  if (handler) handler();
}
