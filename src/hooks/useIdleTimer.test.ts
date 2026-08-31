import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useIdleTimer } from './useIdleTimer';

describe('useIdleTimer hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call onIdle callback after the specified timeout', () => {
    const onIdleMock = vi.fn();
    renderHook(() => useIdleTimer({ timeout: 5000, onIdle: onIdleMock }));

    expect(onIdleMock).not.toHaveBeenCalled();

    // Advance time just before the timeout
    vi.advanceTimersByTime(4999);
    expect(onIdleMock).not.toHaveBeenCalled();

    // Advance time to hit the timeout
    vi.advanceTimersByTime(1);
    expect(onIdleMock).toHaveBeenCalledTimes(1);
  });

  it('should reset the timer when user activity is detected', () => {
    const onIdleMock = vi.fn();
    renderHook(() => useIdleTimer({ timeout: 5000, onIdle: onIdleMock }));

    // Advance time by 3000ms
    vi.advanceTimersByTime(3000);

    // Simulate user activity
    window.dispatchEvent(new Event('mousemove'));

    // Advance time by another 3000ms (total 6000ms since start, but only 3000ms since reset)
    vi.advanceTimersByTime(3000);
    
    // Should NOT be called because timer was reset
    expect(onIdleMock).not.toHaveBeenCalled();

    // Advance by another 2000ms to hit the new 5000ms limit
    vi.advanceTimersByTime(2000);
    expect(onIdleMock).toHaveBeenCalledTimes(1);
  });
});