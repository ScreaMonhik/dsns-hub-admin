import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/apiClient';
import { clearAuthStorage, setAuthTokens } from '../utils/authStorage';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        setAuthTokens(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          console.error('Logout API failed', error);
        } finally {
          clearAuthStorage();
          set({ user: null, isAuthenticated: false });
        }
      },
      updateCurrentUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),
    }),
    {
      name: 'auth_storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const hasToken = Boolean(localStorage.getItem('jwt_token'));
        if (!hasToken || !state.user) {
          state.user = null;
          state.isAuthenticated = false;
          return;
        }
        state.isAuthenticated = true;
      },
    }
  )
);
