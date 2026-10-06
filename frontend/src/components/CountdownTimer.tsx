import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  initialRemainingMs?: number;
  durationMs: number;
  serverStartTimeMs?: number;
  serverCurrentTimeMs?: number;
  onExpire?: () => void;
  isPaused?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialRemainingMs,
  durationMs,
  serverStartTimeMs,
  serverCurrentTimeMs,
  onExpire,
  isPaused = false,
}) => {
  const computeInitialMs = (): number => {
    // 1. Authoritative remaining time sent by backend state
    if (typeof initialRemainingMs === 'number' && initialRemainingMs > 0) {
      return Math.min(durationMs, initialRemainingMs);
    }
    // 2. Relative server elapsed delta (zero clock skew since both timestamps from server)
    if (serverStartTimeMs && serverCurrentTimeMs && serverCurrentTimeMs >= serverStartTimeMs) {
      const serverElapsed = serverCurrentTimeMs - serverStartTimeMs;
      if (serverElapsed < durationMs) {
        return durationMs - serverElapsed;
      }
    }
    // 3. Fallback to full question duration
    return durationMs > 0 ? durationMs : 45000;
  };

  const [remainingMs, setRemainingMs] = useState<number>(computeInitialMs);
  const onExpireCalledRef = useRef<boolean>(false);

  useEffect(() => {
    onExpireCalledRef.current = false;
    const totalMsToRun = computeInitialMs();
    setRemainingMs(totalMsToRun);

    if (isPaused) return;

    const startLocal = performance.now();

    const interval = setInterval(() => {
      const elapsedLocal = performance.now() - startLocal;
      const left = Math.max(0, totalMsToRun - elapsedLocal);

      setRemainingMs(left);

      if (left <= 0 && !onExpireCalledRef.current) {
        onExpireCalledRef.current = true;
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationMs, initialRemainingMs, serverStartTimeMs, serverCurrentTimeMs, isPaused]);

  const percentage = durationMs > 0 ? Math.min(100, Math.max(0, (remainingMs / durationMs) * 100)) : 100;

  const totalSeconds = remainingMs / 1000;
  const wholeSec = Math.floor(totalSeconds);
  const fraction = Math.floor((totalSeconds - wholeSec) * 100);
  const formattedTime = `${String(wholeSec).padStart(2, '0')}.${String(fraction).padStart(2, '0')}`;

  let timeTextColor = 'text-indigo-600 dark:text-indigo-400';
  let barGradient = 'from-indigo-500 via-indigo-600 to-violet-600 shadow-indigo-500/30';

  if (percentage <= 20) {
    timeTextColor = 'text-rose-600 animate-pulse';
    barGradient = 'from-rose-500 via-red-600 to-rose-700 shadow-rose-500/50 animate-pulse';
  } else if (percentage <= 40) {
    timeTextColor = 'text-amber-600';
    barGradient = 'from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/40';
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-black text-slate-400">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Round Timer</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-base sm:text-lg font-black tabular-nums tracking-tight ${timeTextColor}`}>
            {formattedTime}s
          </span>
        </div>
      </div>

      <div className="relative w-full h-3 sm:h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r shadow-md transition-all duration-75 ${barGradient}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
