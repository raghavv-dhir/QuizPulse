import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Users, 
  EyeOff, 
  Terminal, 
  Copy, 
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface PreTestBriefingModalProps {
  quizId: number;
  quizTitle: string;
  isOpen: boolean;
  onCleared: () => void;
}

export const PreTestBriefingModal: React.FC<PreTestBriefingModalProps> = ({
  quizId,
  quizTitle,
  isOpen,
  onCleared,
}) => {
  const storageKey = `quiz_${quizId}_briefing_cleared`;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [hasAgreed, setHasAgreed] = useState<boolean>(false);

  // Check if previously cleared in this session
  useEffect(() => {
    if (sessionStorage.getItem(storageKey) === 'true') {
      onCleared();
    }
  }, [storageKey, onCleared]);

  // 30-second countdown timer
  useEffect(() => {
    if (!isOpen) return;

    if (secondsRemaining > 0) {
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, secondsRemaining]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (secondsRemaining > 0 || !hasAgreed) return;
    sessionStorage.setItem(storageKey, 'true');
    onCleared();
  };

  const isTimerDone = secondsRemaining === 0;

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden my-auto animate-scale-in">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-800 p-5 sm:p-6 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-1">
                  <span>Mandatory Security Briefing</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Examination & Anti-Cheating Rules
                </h2>
                <p className="text-xs text-indigo-100 font-medium truncate max-w-md">
                  {quizTitle}
                </p>
              </div>
            </div>

            {/* Mandatory 30s Countdown Pill */}
            <div className="shrink-0 flex items-center sm:flex-col items-end gap-1.5 bg-black/25 px-3.5 py-2 rounded-2xl border border-white/15">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
                <Clock className={`w-4 h-4 ${!isTimerDone ? 'animate-spin' : ''}`} />
                <span>{isTimerDone ? 'Read Complete' : `Read for ${secondsRemaining}s`}</span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium">
                {isTimerDone ? 'Agreement unlocked' : 'Mandatory reading time'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Rules List */}
        <div className="p-5 sm:p-7 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* Section 1: Strict Anti-Cheating Telemetry */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                1. Active Integrity Monitoring & Prohibitions
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <EyeOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">No Tab Switching / Window Blur</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    Leaving the exam tab, minimizing, or clicking external apps registers an automated infraction.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <Terminal className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">DevTools & Inspect Disabled</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    F12, console shortcuts, and window resize thresholds trigger immediate integrity flags.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <Copy className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">Clipboard & Copying Blocked</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    Copying question text for external search or pasting answers is strictly prevented.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <Maximize2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">Screenshots & Screen Exits</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    PrintScreen, multi-screen navigation, and snipping tool shortcuts are logged.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: 3-Warning Disqualification Rule */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>3-Warning Termination Policy</span>
            </div>
            <p className="text-[11px] sm:text-xs text-rose-800 leading-relaxed font-medium">
              You will receive a warning notice for infractions 1 and 2. <strong>Upon the 3rd infraction, your test will be immediately terminated and disqualified</strong>. Your score will be frozen and reported to the Quiz Master.
            </p>
          </div>

          {/* Section 3: Scoring & Team Rules */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                2. Test Mechanics & Team Eligibility
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">Speed-Based Scoring</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Points are calculated with millisecond accuracy. Faster correct answers earn higher points.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-violet-50/60 border border-violet-100 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">Teams of 1 to 4 Members Allowed</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    You can participate as a <strong>1-member solo squad</strong> or invite up to 3 peers. First teammate submission locks the answer.
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer: Mandatory Tick & Action Button */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200/80 space-y-4">
          
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
            !isTimerDone
              ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              : hasAgreed
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 shadow-sm'
          }`}>
            <input
              type="checkbox"
              disabled={!isTimerDone}
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-xs font-semibold select-none leading-relaxed">
              <span>
                I confirm that I have read the examination instructions and agree to strictly follow all academic integrity rules. I understand that receiving 3 warnings will result in immediate disqualification.
              </span>
              {!isTimerDone && (
                <span className="block text-amber-700 font-extrabold mt-1">
                  ⏳ Please review the rules carefully for {secondsRemaining}s before checking this box.
                </span>
              )}
            </div>
          </label>

          <button
            onClick={handleConfirm}
            disabled={!isTimerDone || !hasAgreed}
            className={`w-full !h-12 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
              !isTimerDone || !hasAgreed
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'btn-primary shadow-indigo-500/25 active:scale-[0.99]'
            }`}
          >
            {!isTimerDone ? (
              <span>Reading Required ({secondsRemaining}s remaining)...</span>
            ) : !hasAgreed ? (
              <span>Please tick the agreement checkbox above</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>I Understand & Agree — Enter Quiz Waiting Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
