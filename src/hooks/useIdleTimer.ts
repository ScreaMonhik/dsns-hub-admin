import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  timeout?: number;
  onIdle: () => void;
}

export const useIdleTimer = ({ timeout = 15 * 60 * 1000, onIdle }: UseIdleTimerOptions) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIdle = useCallback(() => {
    onIdle();
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleIdle, timeout);
  }, [timeout, handleIdle]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    let lastResetAt = 0;

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastResetAt < 1000) return;
      lastResetAt = now;
      resetTimer();
    };

    resetTimer();
    lastResetAt = Date.now();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);
};