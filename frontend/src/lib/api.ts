const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; details?: unknown } };

async function getStoredToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access') || null;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      error: {
        message: json?.error?.message || json?.detail || 'Erro na requisição',
        details: json?.error?.details ?? json,
      },
    };
  }
  return { success: true, data: json.data ?? json };
}

export async function apiFormData<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const token = await getStoredToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: formData,
    headers,
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      error: {
        message: json?.error?.message || json?.detail || 'Erro na requisição',
        details: json?.error?.details ?? json,
      },
    };
  }
  return { success: true, data: json.data ?? json };
}

export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
