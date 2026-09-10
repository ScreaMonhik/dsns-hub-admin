export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && message.length > 0) return String(message[0]);

  return fallback;
}
