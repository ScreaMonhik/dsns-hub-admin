import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCan } from './useCan';
import { useAuthStore } from '../store/authStore';

// Mock the Zustand store
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useCan hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false for all checks if user is not authenticated', () => {
    // Mock selector returning null (no user)
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ user: null }));

    const { result } = renderHook(() => useCan());

    expect(result.current.can('USER')).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAtLeastAdmin).toBe(false);
  });

  it('should validate SUPER_ADMIN role correctly', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => 
      selector({ user: { role: 'SUPER_ADMIN' } })
    );

    const { result } = renderHook(() => useCan());

    expect(result.current.can('SUPER_ADMIN')).toBe(true);
    expect(result.current.can('USER')).toBe(false);
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.isAdmin).toBe(false); 
    expect(result.current.isAtLeastAdmin).toBe(true);
  });

  it('should validate array of roles correctly', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => 
      selector({ user: { role: 'ADMIN' } })
    );

    const { result } = renderHook(() => useCan());

    expect(result.current.can(['ADMIN', 'SUPER_ADMIN'])).toBe(true);
    expect(result.current.can(['USER', 'SUPER_ADMIN'])).toBe(false);
  });
});