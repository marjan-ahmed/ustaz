import { useState, useEffect, useRef } from 'react';

export interface ServiceTimerState {
  elapsedMs: number;
  elapsedFormatted: string;
  isRunning: boolean;
}

/**
 * Tracks elapsed time since `startedAt` timestamp, updating every second.
 * Returns formatted HH:MM:SS and millisecond precision.
 */
export function useServiceTimer(startedAt: string | null | undefined): ServiceTimerState {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startedAt) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setNow(Date.now());
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  if (!startedAt) {
    return { elapsedMs: 0, elapsedFormatted: '00:00:00', isRunning: false };
  }

  const startedMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedMs)) {
    return { elapsedMs: 0, elapsedFormatted: '00:00:00', isRunning: false };
  }

  const elapsedMs = Math.max(0, now - startedMs);
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const elapsedFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return { elapsedMs, elapsedFormatted, isRunning: true };
}
