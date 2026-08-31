import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import toast from 'react-hot-toast';
import { apiClient } from './apiClient';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

const originalLocation = window.location;

describe('apiClient Axios Interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock window.location for redirect testing
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  it('should attach Authorization header if jwt_token exists in localStorage', async () => {
    localStorage.setItem('jwt_token', 'test_token_123');

    // Extract the fulfilled handler of the request interceptor
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const config = { headers: {} };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBe('Bearer test_token_123');
  });

  it('should not attach Authorization header if jwt_token is missing', async () => {
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const config = { headers: {} };
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should show toast error and reject on 429 status response', async () => {
    // Extract the rejected handler of the response interceptor
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;

    const mockError = {
      response: { status: 429 },
      config: {}
    };

    await expect(responseInterceptorError(mockError)).rejects.toEqual(mockError);
    expect(toast.error).toHaveBeenCalledWith('Забагато запитів. Зачекайте хвилину.');
  });

  it('should redirect to /login and clear storage on 401 without refresh token', async () => {
    const responseInterceptorError = (apiClient.interceptors.response as any).handlers[0].rejected;

    // Simulate state where access token is expired but NO refresh token exists
    localStorage.setItem('jwt_token', 'expired_token');
    localStorage.setItem('auth_storage', '{"user":{}}');
    
    const mockError = {
      response: { status: 401 },
      config: { _retry: false }
    };

    await expect(responseInterceptorError(mockError)).rejects.toEqual(mockError);

    // Verify complete cleanup
    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('auth_storage')).toBeNull();
    
    // Verify redirect
    expect(window.location.href).toContain('/login');
  });
});