import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  serverStartTimeMs: number;
  durationMs: number;
  onExpire?: () => void;
  isPaused?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  serverStartTimeMs,
  durationMs,
  onExpire,
  isPaused = false,
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const elapsed = Date.now() - serverStartTimeMs;
    return Math.max(0, durationMs - elapsed);
  });

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - serverStartTimeMs;
      const left = Math.max(0, durationMs - elapsed);

      setRemainingMs(left);

      if (left <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [serverStartTimeMs, durationMs, isPaused, onExpire]);

  const percentage = Math.min(100, Math.max(0, (remainingMs / durationMs) * 100));

  const totalSeconds = remainingMs / 1000;
  const wholeSec = Math.floor(totalSeconds);
  const fraction = Math.floor((totalSeconds - wholeSec) * 100);
  const formattedTime = `${String(wholeSec).padStart(2, '0')}.${String(fraction).padStart(2, '0')}`;

  let timeTextColor = 'text-indigo-600';
  let barGradient = 'from-indigo-500 to-violet-600';

  if (percentage <= 20) {
    timeTextColor = 'text-rose-600 animate-pulse';
    barGradient = 'from-rose-500 to-red-600';
  } else if (percentage <= 40) {
    timeTextColor = 'text-amber-600';
    barGradient = 'from-amber-500 to-orange-500';
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] sm:text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Timer</span>
        </span>
        <span className={`font-mono text-sm sm:text-base font-black tabular-nums ${timeTextColor}`}>
          {formattedTime}s
        </span>
      </div>

      <div className="w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-75 ${barGradient}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
