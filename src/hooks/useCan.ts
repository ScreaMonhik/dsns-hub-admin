import { useAuthStore, type User } from '../store/authStore';

export type Role = User['role'];

export const useCan = () => {
  const user = useAuthStore((state) => state.user);

  const can = (allowedRoles: Role | Role[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(user.role);
  };

  const isSuperAdmin = can('SUPER_ADMIN');
  const isAdmin = can('ADMIN');
  const isAtLeastAdmin = can(['SUPER_ADMIN', 'ADMIN']);

  return { can, isSuperAdmin, isAdmin, isAtLeastAdmin, role: user?.role };
};