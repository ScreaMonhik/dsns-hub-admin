import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore, type User } from '../store/authStore';

const adminUser: User = {
  id: '1',
  email: 'admin@dsns.gov.ua',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isActive: true,
  avatarUrl: null,
  createdAt: '2026-01-01',
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/profile" element={<div>profile-page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>dashboard-page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('sends an admin with forcePasswordChange to /profile', () => {
    sessionStorage.setItem('dsns_session', '1');
    useAuthStore.setState({
      isAuthenticated: true,
      user: { ...adminUser, forcePasswordChange: true },
    });

    renderAt('/');
    expect(screen.getByText('profile-page')).toBeInTheDocument();
  });

  it('lets an admin without the flag stay on the dashboard', () => {
    sessionStorage.setItem('dsns_session', '1');
    useAuthStore.setState({
      isAuthenticated: true,
      user: adminUser,
    });

    renderAt('/');
    expect(screen.getByText('dashboard-page')).toBeInTheDocument();
  });
});
