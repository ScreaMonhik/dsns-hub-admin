import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { clearAuthStorage, getAccessToken, getRefreshToken, setAuthTokens } from '../utils/authStorage';
import { getApiBaseUrl, getApiOrigin } from '../utils/url';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
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
    if (isInternalApiRequest(config)) {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
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

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpointWithoutRefresh(originalRequest)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        setAuthTokens(accessToken, newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        redirectToLogin();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
