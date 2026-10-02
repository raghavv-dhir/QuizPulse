import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  XCircle, 
  EyeOff, 
  Maximize2, 
  Copy, 
  Terminal, 
  MousePointer, 
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface CheatingDetectorProps {
  quizId: number;
  fullscreenRequired?: boolean;
  onTerminated?: () => void;
}

interface ViolationIncident {
  id: string;
  type: string;
  title: string;
  details: string;
  timestamp: string;
  warningNumber: number;
}

export const CheatingDetector: React.FC<CheatingDetectorProps> = ({
  quizId,
  fullscreenRequired = false,
  onTerminated,
}) => {
  const navigate = useNavigate();

  // Load persistent warnings from sessionStorage so refresh cannot bypass warnings
  const storageKeyWarnings = `quiz_${quizId}_integrity_warnings`;
  const storageKeyDisqualified = `quiz_${quizId}_integrity_disqualified`;

  const [warningCount, setWarningCount] = useState<number>(() => {
    const saved = sessionStorage.getItem(storageKeyWarnings);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isDisqualified, setIsDisqualified] = useState<boolean>(() => {
    return sessionStorage.getItem(storageKeyDisqualified) === 'true';
  });

  const [activeModal, setActiveModal] = useState<{
    warningNumber: number;
    title: string;
    details: string;
    type: string;
  } | null>(null);

  const [ackCountdown, setAckCountdown] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [violationsList, setViolationsList] = useState<ViolationIncident[]>([]);

  // Debounce ref to coalesce cascading events (e.g. blur + visibilitychange + mouseleave on Alt+Tab)
  const lastIncidentTimeRef = useRef<number>(0);
  const DEBOUNCE_COALESCE_MS = 2500;

  // Sync disqualification to parent if already disqualified
  useEffect(() => {
    if (isDisqualified && onTerminated) {
      onTerminated();
    }
  }, [isDisqualified, onTerminated]);

  // Handle countdown timer for modal acknowledgment
  useEffect(() => {
    if (ackCountdown > 0) {
      const timer = setTimeout(() => setAckCountdown(ackCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [ackCountdown]);

  // Core Integrity Event Handler
  const triggerViolation = useCallback(
    async (type: string, title: string, details: string) => {
      const now = Date.now();

      // Intelligent Coalescing: Ignore rapid secondary triggers from the same action
      if (now - lastIncidentTimeRef.current < DEBOUNCE_COALESCE_MS) {
        return;
      }
      lastIncidentTimeRef.current = now;

      // Calculate next warning count (capped at 3)
      const currentWarnings = parseInt(sessionStorage.getItem(storageKeyWarnings) || '0', 10);
      const nextCount = currentWarnings + 1;

      // Update state and storage
      sessionStorage.setItem(storageKeyWarnings, nextCount.toString());
      setWarningCount(nextCount);

      const incident: ViolationIncident = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        details,
        timestamp: new Date().toLocaleTimeString(),
        warningNumber: nextCount,
      };
      setViolationsList((prev) => [incident, ...prev]);

      // Haptic/audio feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      // Check for disqualification (3 warnings reached)
      if (nextCount >= 3) {
        sessionStorage.setItem(storageKeyDisqualified, 'true');
        setIsDisqualified(true);
        setActiveModal(null);
        if (onTerminated) onTerminated();

        try {
          await api.quizzes.reportCheating(
            quizId,
            'DISQUALIFIED',
            `Participant exceeded 3 warnings: ${details} (${type})`
          );
        } catch (e) {
          console.error('Failed to report disqualification', e);
        }
      } else {
        // Show Warning Modal (Warning 1 or 2)
        setActiveModal({
          warningNumber: nextCount,
          title,
          details,
          type,
        });
        setAckCountdown(2); // Force 2 seconds cooldown to ensure reading

        try {
          await api.quizzes.reportCheating(quizId, type, details);
        } catch (e) {
          console.error('Failed to report integrity event', e);
        }
      }
    },
    [quizId, storageKeyWarnings, storageKeyDisqualified, onTerminated]
  );

  // Setup Anti-Cheating Event Listeners
  useEffect(() => {
    if (isDisqualified) return;

    // 1. Tab Switch / Document Visibility Change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(
          'TAB_SWITCH',
          'Tab Switch / Backgrounding Detected',
          'You navigated away from the exam tab or minimized the browser window.'
        );
      }
    };

    // 2. Window Blur (Losing focus / secondary monitor clicks)
    const handleWindowBlur = () => {
      triggerViolation(
        'WINDOW_BLUR',
        'Window Focus Lost',
        'Focus left the test window. Interacting with other applications or screens is prohibited.'
      );
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && fullscreenRequired) {
        triggerViolation(
          'FULLSCREEN_EXIT',
          'Fullscreen Mode Exited',
          'Fullscreen is strictly required for this competition.'
        );
      }
    };

    // 4. Clipboard Interceptions (Copy, Cut, Paste)
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation(
        'CLIPBOARD_VIOLATION',
        'Copy Attempt Blocked',
        'Copying quiz content or questions to the clipboard is strictly prohibited.'
      );
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation(
        'CLIPBOARD_VIOLATION',
        'Cut Attempt Blocked',
        'Clipboard cut operations are disabled during the test.'
      );
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation(
        'CLIPBOARD_VIOLATION',
        'Paste Attempt Blocked',
        'Pasting external data into the test session is prohibited.'
      );
    };

    // 5. Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation(
        'CONTEXT_MENU_VIOLATION',
        'Right-Click Context Menu Blocked',
        'Context menus and inspection tools are disabled in the live exam room.'
      );
    };

    // 6. Suspicious Key Combinations & DevTools Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation(
          'DEVTOOLS_OPEN',
          'Developer Tools Shortcut (F12)',
          'Attempted to open browser developer tools.'
        );
        return;
      }

      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      // Ctrl+Shift+C / Cmd+Option+C (Elements)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)
      ) {
        e.preventDefault();
        triggerViolation(
          'DEVTOOLS_OPEN',
          'Developer Console Shortcut',
          'Inspect Element and console inspection shortcuts are prohibited.'
        );
        return;
      }

      // Ctrl+U / Cmd+Option+U (View Source)
      if ((e.ctrlKey || e.metaKey) && ['u', 'U'].includes(e.key)) {
        e.preventDefault();
        triggerViolation(
          'DEVTOOLS_OPEN',
          'Page Source Shortcut',
          'Viewing raw page source is prohibited during the quiz.'
        );
        return;
      }

      // Screenshot shortcuts (PrintScreen, Windows+Shift+S)
      if (
        e.key === 'PrintScreen' ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && ['s', 'S', '3', '4'].includes(e.key))
      ) {
        triggerViolation(
          'SUSPICIOUS_KEY_COMBINATION',
          'Screenshot Shortcut Detected',
          'Capturing screen or recording exam questions is prohibited.'
        );
      }
    };

    // 7. Mouse Leaving Boundary (Multi-screen detection)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        triggerViolation(
          'MOUSE_LEAVE',
          'Cursor Exited Screen Bounds',
          'Cursor left the test viewport. Working across multiple screens is prohibited.'
        );
      }
    };

    // 8. DevTools Window Dimension Heuristic
    const handleResize = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        triggerViolation(
          'DEVTOOLS_OPEN',
          'Developer Tools Window Detected',
          'An inspection dock or developer tools window resize was detected.'
        );
      }
    };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [triggerViolation, isDisqualified, fullscreenRequired]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleAcknowledgeWarning = () => {
    if (ackCountdown > 0) return;
    setActiveModal(null);
  };

  // -------------------------------------------------------------
  // RENDER: DISQUALIFIED TERMINATION SCREEN (TERMINATED AFTER 3 WARNINGS)
  // -------------------------------------------------------------
  if (isDisqualified) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="ui-card max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-500 shadow-2xl shadow-rose-950/50 text-center space-y-6 animate-scale-in">
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-rose-50">
            <XCircle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Test Terminated</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Disqualified for Integrity Violations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
              Your test has been automatically stopped and locked. You have reached the maximum threshold of <strong>3 anti-cheating warnings</strong>.
            </p>
          </div>

          {/* Audit Breakdown Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
              <span>Incident Telemetry</span>
              <span className="text-rose-600 font-black">3 of 3 Warnings Triggered</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-600">
              <li className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Violation Status:</span>
                <span className="badge bg-rose-100 text-rose-800 font-bold">DISQUALIFIED</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Host Notification:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Logged to Quiz Master
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Submissions Locked:</span>
                <span className="text-rose-700 font-bold">Answer capability disabled</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/quizzes')}
              className="btn-primary w-full !h-12 text-sm bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20"
            >
              <span>Return to Competitions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Audit ID: {quizId}-DISQ-{Date.now().toString(36).toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* -------------------------------------------------------------
          FLOATING INTEGRITY BADGE PILL (LIVE STATUS IN ROOM)
      ------------------------------------------------------------- */}
      <div className="fixed top-20 right-4 z-40">
        <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 shadow-sm backdrop-blur-md transition-all ${
          warningCount === 0
            ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80'
            : warningCount === 1
            ? 'bg-amber-50/90 text-amber-800 border-amber-300'
            : 'bg-rose-50/90 text-rose-800 border-rose-300 animate-pulse'
        }`}>
          {warningCount === 0 ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>
            Integrity Guard: <strong>{warningCount}/3</strong> Warnings
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FULLSCREEN ENFORCEMENT BANNER (IF REQUIRED)
      ------------------------------------------------------------- */}
      {fullscreenRequired && !isFullscreen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={toggleFullscreen}
            className="btn-primary !h-10 text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Enter Required Fullscreen</span>
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          HIGH-URGENCY WARNING MODAL (WARNING 1 OR WARNING 2 OF 3)
      ------------------------------------------------------------- */}
      {activeModal && (
        <div className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`ui-card max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 border-2 shadow-2xl text-center space-y-5 animate-scale-in ${
            activeModal.warningNumber === 1
              ? 'border-amber-400 shadow-amber-500/20'
              : 'border-rose-500 shadow-rose-500/25'
          }`}>
            
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
              activeModal.warningNumber === 1
                ? 'bg-amber-100 text-amber-600 ring-8 ring-amber-50'
                : 'bg-rose-100 text-rose-600 ring-8 ring-rose-50'
            }`}>
              <AlertTriangle className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            <div className="space-y-1.5">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                activeModal.warningNumber === 1
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                <span>⚠️ Warning {activeModal.warningNumber} of 3</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {activeModal.details}
              </p>
            </div>

            {/* Warning Progression Visual Bar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Violations Allowed Before Disqualification:</span>
                <span className="font-black text-slate-900">{3 - activeModal.warningNumber} Remaining</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-2.5 rounded-full bg-rose-500" />
                <div className={`h-2.5 rounded-full ${activeModal.warningNumber >= 2 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                <div className={`h-2.5 rounded-full ${activeModal.warningNumber >= 3 ? 'bg-rose-500' : 'bg-slate-200'}`} />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                {activeModal.warningNumber === 1 && (
                  <span>Next violation will trigger your final warning before disqualification.</span>
                )}
                {activeModal.warningNumber === 2 && (
                  <span className="text-rose-600 font-bold">
                    CRITICAL: Exactly ONE violation remaining. Any additional violation will immediately terminate your test.
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={handleAcknowledgeWarning}
              disabled={ackCountdown > 0}
              className={`w-full !h-12 rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                ackCountdown > 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : activeModal.warningNumber === 1
                  ? 'btn-primary'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
              }`}
            >
              {ackCountdown > 0 ? (
                <span>Please review notice ({ackCountdown}s)...</span>
              ) : (
                <>
                  <span>I Acknowledge & Resume Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
