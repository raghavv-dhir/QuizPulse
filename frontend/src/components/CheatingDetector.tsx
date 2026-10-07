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

// Helper to detect mobile or touch-screen devices
const isMobileOrTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isNarrowScreen = window.innerWidth <= 1024;
  return isMobileUA || (hasTouch && isNarrowScreen);
};

export const CheatingDetector: React.FC<CheatingDetectorProps> = ({
  quizId,
  fullscreenRequired = false,
  onTerminated,
}) => {
  const navigate = useNavigate();

  // Load persistent warnings from sessionStorage so refresh cannot bypass warnings
  const storageKeyWarnings = `quiz_${quizId}_integrity_warnings`;

  const [warningCount, setWarningCount] = useState<number>(() => {
    const saved = sessionStorage.getItem(storageKeyWarnings);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [activeModal, setActiveModal] = useState<{
    warningNumber: number;
    title: string;
    details: string;
    type: string;
  } | null>(null);

  const activeModalRef = useRef(activeModal);
  activeModalRef.current = activeModal;

  const mountTimeRef = useRef<number>(Date.now());
  const [ackCountdown, setAckCountdown] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [violationsList, setViolationsList] = useState<ViolationIncident[]>([]);

  // Debounce ref to coalesce cascading events
  const lastIncidentTimeRef = useRef<number>(0);
  const DEBOUNCE_COALESCE_MS = 4000;

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

      // Grace period on initial mount to allow viewport and DOM stabilization (e.g. mobile address bar)
      if (now - mountTimeRef.current < 2000) {
        return;
      }

      // If a modal is already active or being acknowledged, ignore duplicate triggers
      if (activeModalRef.current !== null) {
        return;
      }

      // Intelligent Coalescing: Ignore rapid secondary triggers
      if (now - lastIncidentTimeRef.current < DEBOUNCE_COALESCE_MS) {
        return;
      }
      lastIncidentTimeRef.current = now;

      // Calculate next warning count
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

      // Show Warning Modal (never terminate - warnings only)
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
    },
    [quizId, storageKeyWarnings]
  );

  // Setup Anti-Cheating Event Listeners
  useEffect(() => {
    const isMobile = isMobileOrTouchDevice();

    // 1. Tab Switch / Document Visibility Change (Reliable across desktop & mobile)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(
          'TAB_SWITCH',
          'Tab Switch / Backgrounding Detected',
          'You navigated away from the exam tab or minimized the browser window.'
        );
      }
    };

    // 2. Window Blur (Desktop only - mobile triggers blur on address bar, keyboard, notifications)
    let blurTimeout: any = null;
    const handleWindowBlur = () => {
      if (isMobile) {
        // Mobile browsers fire window.blur on address-bar collapse, virtual keyboard popup,
        // and system overlays. Visibility change handles real app/tab switching on mobile.
        return;
      }
      blurTimeout = setTimeout(() => {
        if (!document.hasFocus() || document.hidden) {
          triggerViolation(
            'WINDOW_BLUR',
            'Window Focus Lost',
            'Focus left the test window. Interacting with other applications or screens is prohibited.'
          );
        }
      }, 600);
    };

    const handleWindowFocus = () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    };

    // 3. Fullscreen Exit (Desktop only - iOS Safari does not support Fullscreen API on HTML elements)
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && fullscreenRequired && !isMobile) {
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
    // On mobile touchscreens, long-pressing (touch and hold) accidentally fires contextmenu.
    // Silently prevent the context menu without punishing mobile users with a violation warning.
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (isMobile) {
        return;
      }
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

    // 7. Mouse Leaving Boundary (Desktop multi-screen only)
    // Mobile phones do not have cursors or multi-monitors.
    // Finger lifts near the top/bottom of screen must NEVER trigger this.
    const handleMouseLeave = (e: MouseEvent) => {
      if (isMobile) return;
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        triggerViolation(
          'MOUSE_LEAVE',
          'Cursor Exited Screen Bounds',
          'Cursor left the test viewport. Working across multiple screens is prohibited.'
        );
      }
    };

    // 8. DevTools Window Dimension Heuristic (Desktop only)
    // On mobile, window.outerHeight - window.innerHeight > 160 is frequently true due to
    // device pixel ratio, dynamic URL address bars, bottom navigation bars, or virtual keyboards.
    const handleResize = () => {
      if (isMobile) return;
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
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [triggerViolation, fullscreenRequired]);

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
    activeModalRef.current = null;
    lastIncidentTimeRef.current = Date.now();
  };

  const isMobile = isMobileOrTouchDevice();

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
            Integrity Guard: <strong>{warningCount}</strong> Warning{warningCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FULLSCREEN ENFORCEMENT BANNER (IF REQUIRED - DESKTOP ONLY)
      ------------------------------------------------------------- */}
      {fullscreenRequired && !isFullscreen && !isMobile && (
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
          HIGH-VISIBILITY WARNING MODAL (WARNINGS ONLY - NO TERMINATION)
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
                <span>⚠️ Integrity Warning #{activeModal.warningNumber}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {activeModal.details}
              </p>
            </div>

            {/* Warning Advisory Notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Academic Integrity Policy Reminder</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                This test is monitored for fairness. Leaving the window, switching tabs, or using external tools is logged and reported to the host. Please remain focused on your exam screen.
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
