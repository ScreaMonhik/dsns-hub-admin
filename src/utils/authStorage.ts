const SESSION_FLAG_KEY = 'dsns_session';
const AUTH_PERSIST_KEY = 'auth_storage';
const LEGACY_ACCESS_KEY = 'jwt_token';
const LEGACY_REFRESH_KEY = 'refresh_token';

function authStore(): Storage {
  return sessionStorage;
}

export function markSession(): void {
  authStore().setItem(SESSION_FLAG_KEY, '1');
}

export function hasAccessToken(): boolean {
  return authStore().getItem(SESSION_FLAG_KEY) === '1';
}

export function clearAuthStorage(): void {
  authStore().removeItem(SESSION_FLAG_KEY);
  authStore().removeItem(AUTH_PERSIST_KEY);
  authStore().removeItem(LEGACY_ACCESS_KEY);
  authStore().removeItem(LEGACY_REFRESH_KEY);
  localStorage.removeItem(SESSION_FLAG_KEY);
  localStorage.removeItem(AUTH_PERSIST_KEY);
  localStorage.removeItem(LEGACY_ACCESS_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
}
