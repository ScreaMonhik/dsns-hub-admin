import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { apiClient } from '../api/apiClient';

vi.mock('../api/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Reset Zustand store state before each test
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('should authenticate user and mark a cookie session on setAuth', () => {
    const mockUser = { 
      id: '1', email: 'test@dsns.gov.ua', firstName: 'Ivan', lastName: 'Franko', 
      role: 'ADMIN', isActive: true, avatarUrl: null, createdAt: '2023-01-01' 
    } as any;
    
    useAuthStore.getState().setAuth(mockUser);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(sessionStorage.getItem('dsns_session')).toBe('1');
    expect(sessionStorage.getItem('jwt_token')).toBeNull();
    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(localStorage.getItem('auth_storage')).toBeNull();
  });

  it('should clear state, clear localStorage, and call API on logout', async () => {
    // Setup initial authenticated state
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1' } as any });
    sessionStorage.setItem('dsns_session', '1');

    await useAuthStore.getState().logout();

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(sessionStorage.getItem('dsns_session')).toBeNull();
  });

  it('should partially update current user data without affecting other fields', () => {
    useAuthStore.setState({ 
      user: { id: '1', firstName: 'OldName', lastName: 'Franko' } as any 
    });
    
    useAuthStore.getState().updateCurrentUser({ firstName: 'NewName' });

    expect(useAuthStore.getState().user?.firstName).toBe('NewName');
    expect(useAuthStore.getState().user?.lastName).toBe('Franko');
  });
});