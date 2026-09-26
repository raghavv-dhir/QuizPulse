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
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#ECFDF3] border border-[#A6F4C5] text-[#16803C] text-xs font-medium">
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Answer Locked</span>
        <span className="font-mono font-bold tabular-nums ml-1">+{scoreAwarded || 0} pts</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#E5E5E2] text-xs font-medium text-[#4A4A4A]">
      <Zap className="w-3.5 h-3.5 text-[#1D4ED8] fill-[#1D4ED8]" />
      <span>Speed Value:</span>
      <span className="font-mono font-bold text-[#171717] tabular-nums">
        {currentScorePotential} <span className="text-[10px] text-[#6B6B6B] font-normal">/ {maxScore}</span>
      </span>
    </div>
  );
};
