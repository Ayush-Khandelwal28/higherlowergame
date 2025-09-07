import React from 'react';

export interface UseCountdownOptions {
  durationMs: number; // total duration in ms
  autoStart?: boolean; // start automatically on mount
  intervalMs?: number; // resolution (default 250ms)
}

export interface UseCountdownReturn {
  remainingMs: number;
  remainingSeconds: number; // rounded down seconds
  progress: number; // 0..1 elapsed fraction
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useCountdown(opts: UseCountdownOptions): UseCountdownReturn {
  const { durationMs, autoStart = true, intervalMs = 250 } = opts;
  const [remainingMs, setRemainingMs] = React.useState(durationMs);
  const [running, setRunning] = React.useState(autoStart);
  const startedRef = React.useRef<number | null>(null);
  const remainingRef = React.useRef(remainingMs);

  React.useEffect(() => { remainingRef.current = remainingMs; }, [remainingMs]);

  React.useEffect(() => {
    if (!running) return;
    if (startedRef.current == null) {
      startedRef.current = performance.now();
    }
    const tick = () => {
      if (!running) return; // stale closure guard
      const now = performance.now();
      const elapsed = now - (startedRef.current ?? now);
      const nextRemaining = Math.max(0, durationMs - elapsed);
      setRemainingMs(nextRemaining);
      if (nextRemaining > 0) {
        loop = window.setTimeout(tick, intervalMs);
      } else {
        setRunning(false);
      }
    };
    let loop = window.setTimeout(tick, intervalMs);
    return () => { window.clearTimeout(loop); };
  }, [running, durationMs, intervalMs]);

  const start = React.useCallback(() => {
    if (running) return;
    // adjust start time so remainingRef respected
    startedRef.current = performance.now() - (durationMs - remainingRef.current);
    setRunning(true);
  }, [running, durationMs]);

  const pause = React.useCallback(() => { setRunning(false); }, []);
  const reset = React.useCallback(() => {
    setRunning(autoStart);
    startedRef.current = null;
    setRemainingMs(durationMs);
  }, [autoStart, durationMs]);

  return {
    remainingMs,
    remainingSeconds: Math.floor(remainingMs / 1000),
    progress: 1 - remainingMs / durationMs,
    running,
    start,
    pause,
    reset,
  };
}
