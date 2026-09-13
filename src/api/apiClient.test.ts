import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import toast from 'react-hot-toast';
import { apiClient } from './apiClient';

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

const originalLocation = window.location;

function mockLocation(pathname = '') {
  const locationMock = {
    href: '',
    pathname,
    replace: vi.fn(function (this: { href: string }, url: string) {
      this.href = url;
    }),
  };
  delete (window as unknown as { location?: Location }).location;
  (window as unknown as { location: typeof locationMock }).location = locationMock;
  return locationMock;
}

describe('apiClient Axios Interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockLocation('');
  });

  afterEach(() => {
    (window as unknown as { location: Location }).location = originalLocation;
  });

  it('sends requests with credentials and does not attach a JS-readable Bearer token', async () => {
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const config = { headers: {}, url: '/users' };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('should not attach Authorization header for requests to a foreign origin', async () => {
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const config = { headers: { Authorization: 'Bearer leftover' }, url: 'https://evil.example/steal' };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should show toast error and reject on 429 status response', async () => {
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;

    const mockError = {
      response: { status: 429 },
      config: {}
    };

    await expect(responseInterceptorError(mockError)).rejects.toEqual(mockError);
    expect(toast.error).toHaveBeenCalledWith('Забагато запитів. Зачекайте хвилину.');
  });

  it('should redirect to /login and clear storage on 401 without a session flag', async () => {
    const locationMock = mockLocation('/users');
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;

    sessionStorage.setItem('auth_storage', '{"user":{}}');
    
    const mockError = {
      response: { status: 401 },
      config: { _retry: false, url: '/users' }
    };

    await expect(responseInterceptorError(mockError)).rejects.toEqual(mockError);

    expect(sessionStorage.getItem('dsns_session')).toBeNull();
    expect(sessionStorage.getItem('auth_storage')).toBeNull();
    expect(locationMock.replace).toHaveBeenCalledWith('/login');
  });

  it('redirects to /profile on FORCE_PASSWORD_CHANGE', async () => {
    const locationMock = mockLocation('/users');
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;

    const mockError = {
      response: { status: 403, data: { code: 'FORCE_PASSWORD_CHANGE' } },
      config: { url: '/users' },
    };

    await expect(responseInterceptorError(mockError)).rejects.toEqual(mockError);
    expect(toast.error).toHaveBeenCalledWith('Необхідно змінити тимчасовий пароль.');
    expect(locationMock.replace).toHaveBeenCalledWith('/profile');
  });

  it('should not try to refresh tokens on failed login 401', async () => {
    const locationMock = mockLocation('/login');
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;

    const mockError = {
      response: { status: 401 },
      config: { _retry: false, url: '/auth/login' }
    };

    await expect(responseInterceptorError(mockError)).rejects.toEqual(mockError);
    expect(locationMock.replace).not.toHaveBeenCalled();
    expect(locationMock.href).toBe('');
  });
});
