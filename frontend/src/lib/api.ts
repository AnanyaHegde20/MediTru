export const TOKEN_KEY = 'meditru_token';

export const API_ERROR_EVENT = 'meditru:api-error';

const RETRY_DELAY_MS = 250;
const RETRYABLE_STATUSES = [500, 502, 503, 504];
const DUPLICATE_SUPPRESS_MS = 4000;

const lastEmitted = { message: '', at: 0 };

export function emitApiError(message: string) {
  const now = Date.now();
  if (lastEmitted.message === message && now - lastEmitted.at < DUPLICATE_SUPPRESS_MS) {
    return;
  }
  lastEmitted.message = message;
  lastEmitted.at = now;
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: { message } }));
}

export function resetApiErrorDebounce() {
  lastEmitted.message = '';
  lastEmitted.at = 0;
}

const NETWORK_ERROR_MESSAGE = 'Network error — please check your connection and try again.';
const RATE_LIMIT_MESSAGE = 'Too many requests — please slow down and try again in a moment.';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAttempt(path: string, requestInit: RequestInit, isRead: boolean): Promise<Response> {
  try {
    const res = await fetch(path, requestInit);
    if (isRead && RETRYABLE_STATUSES.includes(res.status)) {
      await delay(RETRY_DELAY_MS);
      return await fetch(path, requestInit);
    }
    return res;
  } catch (err) {
    if (!isRead) throw err;
    await delay(RETRY_DELAY_MS);
    return await fetch(path, requestInit);
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const isRead = !init.method || init.method.toUpperCase() === 'GET';
  const hasJsonBody = typeof init.body === 'string';
  const requestInit: RequestInit = {
    ...init,
    headers: {
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...(init.headers || {}),
    },
  };

  let res: Response;
  try {
    res = await fetchAttempt(path, requestInit, isRead);
  } catch {
    if (isRead) {
      emitApiError(NETWORK_ERROR_MESSAGE);
    }
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (res.status === 429 && isRead) {
    emitApiError(RATE_LIMIT_MESSAGE);
  }

  if (res.status === 401 && getToken()) {
    setToken(null);
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  }

  return res;
}
