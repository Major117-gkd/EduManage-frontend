import { API_BASE } from '../config';

function buildUrl(path) {
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE.replace(/\/$/, '');
  const route = normalized.startsWith('/api/') ? normalized.slice(4) : normalized;
  return `${base}${route}`;
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const headers = {
    ...(fetchOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(skipAuth ? {} : getAuthHeaders()),
    ...fetchOptions.headers,
  };

  const response = await fetch(buildUrl(path), {
    ...fetchOptions,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : {};
  }

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Erreur serveur');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
};

export { API_BASE };
