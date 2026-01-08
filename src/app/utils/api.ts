const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type Tokens = { access: string; refresh: string };

export function setTokens(tokens: Tokens) {
  localStorage.setItem('tl_access', tokens.access);
  localStorage.setItem('tl_refresh', tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem('tl_access');
  localStorage.removeItem('tl_refresh');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('tl_access');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('tl_refresh');
}

async function postJSON(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
  } catch {
    return { ok: res.ok, status: res.status, data: null };
  }
}

export async function obtainToken(username: string, password: string) {
  return postJSON('/api/token/', { username, password });
}

export async function refreshToken(refresh: string) {
  return postJSON('/api/token/refresh/', { refresh });
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const access = getAccessToken();
  const headers = new Headers(init?.headers as HeadersInit);
  if (access) headers.set('Authorization', `Bearer ${access}`);
  const res = await fetch(`${API_BASE}${typeof input === 'string' ? input : ''}`, { ...init, headers });

  if (res.status !== 401) {
    return res;
  }

  // Try refresh once
  const refresh = getRefreshToken();
  if (!refresh) {
    return res;
  }
  const r = await refreshToken(refresh);
  if (r.ok && r.data && r.data.access) {
    setTokens({ access: r.data.access, refresh });
    // retry original request with new access
    const headers2 = new Headers(init?.headers as HeadersInit);
    headers2.set('Authorization', `Bearer ${r.data.access}`);
    return fetch(`${API_BASE}${typeof input === 'string' ? input : ''}`, { ...init, headers: headers2 });
  }

  return res;
}

export default API_BASE;

export async function fetchMe() {
  const res = await fetchWithAuth('/api/me/');
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : null;
    if (res.ok && data) {
      localStorage.setItem('tl_user', JSON.stringify(data));
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: res.ok, status: res.status, data: null };
  }
}

export function getLocalUser() {
  const raw = localStorage.getItem('tl_user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
