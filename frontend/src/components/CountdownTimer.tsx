import React, { useEffect, useState } from 'react';

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

  // Format as SS.SS (e.g. 07.42)
  const totalSeconds = remainingMs / 1000;
  const wholeSec = Math.floor(totalSeconds);
  const fraction = Math.floor((totalSeconds - wholeSec) * 100);
  const formattedTime = `${String(wholeSec).padStart(2, '0')}.${String(fraction).padStart(2, '0')}`;

  let timeTextColor = 'text-[#171717]';
  let barColor = 'bg-[#171717]';

  if (percentage <= 20) {
    timeTextColor = 'text-[#C62828]';
    barColor = 'bg-[#C62828]';
  } else if (percentage <= 40) {
    timeTextColor = 'text-[#A16207]';
    barColor = 'bg-[#A16207]';
  }

  return (
    <div className="w-full space-y-2 text-center">
      <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-[#6B6B6B]">
        <span>Time Remaining</span>
        <span className={`font-mono text-sm font-bold tabular-nums ${timeTextColor}`}>
          {formattedTime}s
        </span>
      </div>

      {/* Minimal clean progress bar (4px height) */}
      <div className="w-full h-1.5 bg-[#E5E5E2] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-75 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
