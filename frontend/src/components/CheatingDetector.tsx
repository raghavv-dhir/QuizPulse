import React, { useEffect, useState } from 'react';
import { AlertCircle, Maximize2 } from 'lucide-react';
import { api } from '../api/client';

interface CheatingDetectorProps {
  quizId: number;
  fullscreenRequired?: boolean;
}

export const CheatingDetector: React.FC<CheatingDetectorProps> = ({
  quizId,
  fullscreenRequired = false,
}) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportEvent('TAB_SWITCH', 'Window focus lost / tab switched');
      }
    };

    const handleWindowBlur = () => {
      reportEvent('WINDOW_BLUR', 'Browser window lost focus');
    };

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && fullscreenRequired) {
        reportEvent('FULLSCREEN_EXIT', 'Exited fullscreen mode');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [quizId, fullscreenRequired]);

  const reportEvent = async (type: string, details: string) => {
    try {
      setWarningMessage(`Notice: ${details} (Recorded for Quiz Master)`);
      setTimeout(() => setWarningMessage(null), 4000);
      await api.quizzes.reportCheating(quizId, type, details);
    } catch (e) {
      console.error('Failed to report audit event', e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <>
      {warningMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-sm p-3 rounded-md bg-white border border-[#E5E5E2] shadow-dropdown flex items-start gap-2.5 text-xs text-[#171717] animate-fade-in">
          <AlertCircle className="w-4 h-4 text-[#A16207] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Integrity Monitor</span>
            <span className="text-[#6B6B6B]">{warningMessage}</span>
          </div>
        </div>
      )}

      {fullscreenRequired && !isFullscreen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={toggleFullscreen}
            className="btn-secondary !h-9 text-xs shadow-card"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen Required</span>
          </button>
        </div>
      )}
    </>
  );
};
