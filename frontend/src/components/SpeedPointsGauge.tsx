import React, { useEffect, useState } from 'react';
import { Zap, Check } from 'lucide-react';

interface SpeedPointsGaugeProps {
  maxScore: number;
  serverStartTimeMs: number;
  durationMs: number;
  isAnswered: boolean;
  scoreAwarded?: number;
}

export const SpeedPointsGauge: React.FC<SpeedPointsGaugeProps> = ({
  maxScore,
  serverStartTimeMs,
  durationMs,
  isAnswered,
  scoreAwarded,
}) => {
  const [currentScorePotential, setCurrentScorePotential] = useState<number>(maxScore);

  useEffect(() => {
    if (isAnswered) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const responseTime = Math.max(0, now - serverStartTimeMs);
      const remainingTime = Math.max(0, durationMs - responseTime);

      if (remainingTime <= 0) {
        setCurrentScorePotential(0);
      } else {
        const potential = Math.floor((maxScore * remainingTime) / durationMs);
        setCurrentScorePotential(Math.max(0, Math.min(maxScore, potential)));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [maxScore, serverStartTimeMs, durationMs, isAnswered]);

  if (isAnswered) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
        <Check className="w-3.5 h-3.5 stroke-[3]" />
        <span>Locked</span>
        <span className="font-mono font-black ml-0.5">+{scoreAwarded || 0} pts</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm">
      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
      <span>Speed:</span>
      <span className="font-mono font-black tabular-nums">
        {currentScorePotential} <span className="text-[10px] text-amber-600/70 font-normal">pts</span>
      </span>
    </div>
  );
};
