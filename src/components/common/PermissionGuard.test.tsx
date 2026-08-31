import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PermissionGuard } from './PermissionGuard';
import { useCan } from '../../hooks/useCan';

vi.mock('../../hooks/useCan', () => ({
  useCan: vi.fn(),
}));

describe('PermissionGuard component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children if user has the required role', () => {
    vi.mocked(useCan).mockReturnValue({ can: () => true } as any);

    render(
      <PermissionGuard require="ADMIN">
        <div data-testid="protected-content">Sensitive Admin Data</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should render fallback if user lacks the required role and fallback is provided', () => {
    vi.mocked(useCan).mockReturnValue({ can: () => false } as any);

    render(
      <PermissionGuard require="SUPER_ADMIN" fallback={<div data-testid="fallback">Access Denied</div>}>
        <div data-testid="protected-content">Sensitive Admin Data</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('should redirect if user lacks the required role and redirectTo is provided', () => {
    vi.mocked(useCan).mockReturnValue({ can: () => false } as any);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <PermissionGuard require="ADMIN" redirectTo="/login">
                <div data-testid="protected-content">Sensitive Admin Data</div>
              </PermissionGuard>
            } 
          />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});