import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090/admin-api';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_refresh_token');
  window.location.href = '/login';
}

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: BASE_URL });

  client.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => {
      // Auto-unwrap ApiResponse<T> → T
      const body = res.data;
      if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
        res.data = body.data;
      }
      return res;
    },
    async (err) => {
      const original = err.config as AxiosRequestConfig & { _retry?: boolean };

      if (err.response?.status === 401 && !original._retry) {
        if (isRefreshing) {
          // Queue request until refresh completes
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (original.headers) original.headers['Authorization'] = `Bearer ${token}`;
            return client(original);
          }).catch(e => Promise.reject(e));
        }

        original._retry = true;
        isRefreshing = true;

        const refreshToken = typeof window !== 'undefined'
          ? localStorage.getItem('admin_refresh_token') : null;

        if (!refreshToken) {
          isRefreshing = false;
          redirectToLogin();
          return Promise.reject(err);
        }

        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          const body = res.data;
          const payload = body?.data || body;
          const newToken: string = payload.access_token;
          const newRefresh: string = payload.refresh_token;

          localStorage.setItem('admin_token', newToken);
          if (newRefresh) localStorage.setItem('admin_refresh_token', newRefresh);
          client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          processQueue(null, newToken);
          if (original.headers) original.headers['Authorization'] = `Bearer ${newToken}`;
          return client(original);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          redirectToLogin();
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(err);
    }
  );

  return client;
}

export const api = createClient();

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data?.error?.message) return String(data.error.message);
    if (data?.message && typeof data.message === 'string') return data.message;
    return err.message || 'Xatolik yuz berdi';
  }
  if (err instanceof Error) return err.message;
  return 'Xatolik yuz berdi';
}

export function unwrap<T>(response: { data: { data: T } | T }): T {
  const d = response.data as { success?: boolean; data?: T };
  return d?.data !== undefined ? d.data : (response.data as T);
}
