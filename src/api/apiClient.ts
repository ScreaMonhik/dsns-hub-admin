import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { clearAuthStorage, hasAccessToken } from '../utils/authStorage';
import { getApiBaseUrl, getApiOrigin } from '../utils/url';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_ENDPOINTS_WITHOUT_REFRESH = /\/auth\/(login|refresh|register|logout)(?:\?|$)/i;

function resolveRequestUrl(config: InternalAxiosRequestConfig): URL | null {
  try {
    const base = config.baseURL || apiClient.defaults.baseURL || getApiBaseUrl();
    const url = config.url || '';
    return new URL(url, base.endsWith('/') ? base : `${base}/`);
  } catch {
    return null;
  }
}

function isInternalApiRequest(config: InternalAxiosRequestConfig): boolean {
  const resolved = resolveRequestUrl(config);
  const apiOrigin = getApiOrigin();
  if (!resolved || !apiOrigin) return false;
  return resolved.origin === apiOrigin;
}

function isAuthEndpointWithoutRefresh(config: InternalAxiosRequestConfig): boolean {
  const resolved = resolveRequestUrl(config);
  const path = resolved?.pathname || config.url || '';
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.test(path);
}

function redirectToLogin() {
  clearAuthStorage();
  if (!window.location.pathname?.startsWith('/login')) {
    window.location.replace('/login');
  }
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!isInternalApiRequest(config) && config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 429) {
      toast.error('Забагато запитів. Зачекайте хвилину.');
      return Promise.reject(error);
    }

    const errorCode = (error.response?.data as { code?: string } | undefined)?.code;
    if (error.response?.status === 403 && errorCode === 'FORCE_PASSWORD_CHANGE') {
      toast.error('Необхідно змінити тимчасовий пароль.');
      if (!window.location.pathname?.startsWith('/profile')) {
        window.location.replace('/profile');
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpointWithoutRefresh(originalRequest)
    ) {
      if (!hasAccessToken()) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest)).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err);
        redirectToLogin();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
