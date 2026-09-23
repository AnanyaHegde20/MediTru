export const TOKEN_KEY = 'meditru_token';

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

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const hasBody = init.body != null;
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && getToken()) {
    setToken(null);
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  }

  return res;
}
