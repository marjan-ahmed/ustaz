'use client';

import { useServiceTimer } from '@/hooks/useServiceTimer';
import { Clock, Timer } from 'lucide-react';

interface ServiceTimerProps {
  startedAt: string | null | undefined;
  className?: string;
  compact?: boolean;
}

export default function ServiceTimer({ startedAt, className = '', compact = false }: ServiceTimerProps) {
  const { elapsedFormatted, isRunning } = useServiceTimer(startedAt);

  if (!isRunning) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm">Service not started</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-mono text-sm font-semibold ${className}`}>
        <Timer className="h-3.5 w-3.5 animate-pulse" />
        {elapsedFormatted}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
        <Timer className="h-3.5 w-3.5" />
        Service Duration
      </div>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono text-3xl font-bold px-6 py-3 rounded-xl shadow-lg">
        {elapsedFormatted}
      </div>
      <p className="text-xs text-gray-400 mt-1">Elapsed time</p>
    </div>
  );
}
