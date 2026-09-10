import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './apiError';

describe('getApiErrorMessage', () => {
  it('returns the API string message when present', () => {
    expect(getApiErrorMessage({ response: { data: { message: 'Заборонено' } } }, 'fallback')).toBe('Заборонено');
  });

  it('uses the first array message from the API', () => {
    expect(getApiErrorMessage({ response: { data: { message: ['Перша', 'Друга'] } } }, 'fallback')).toBe('Перша');
  });

  it('falls back for unknown errors', () => {
    expect(getApiErrorMessage(undefined, 'Не вдалося зберегти')).toBe('Не вдалося зберегти');
    expect(getApiErrorMessage('boom', 'Не вдалося зберегти')).toBe('Не вдалося зберегти');
  });
});
