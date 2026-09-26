import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  QuizState,
  AnswerResult,
  QuizEventMessage,
  LeaderboardEntry,
} from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import { useQuizWebSocket } from '../hooks/useQuizWebSocket';
import { CountdownTimer } from '../components/CountdownTimer';
import { SpeedPointsGauge } from '../components/SpeedPointsGauge';
import { TeamStatusWidget } from '../components/TeamStatusWidget';
import { CheatingDetector } from '../components/CheatingDetector';
import {
  Check,
  X,
  AlertCircle,
  Pause,
  ArrowRight,
  Trophy,
  Zap,
  Sparkles,
} from 'lucide-react';

export const LiveQuizRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [submissionResult, setSubmissionResult] = useState<AnswerResult | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [lockedByUserName, setLockedByUserName] = useState<string | undefined>(undefined);
  const [lockedResponseTimeMs, setLockedResponseTimeMs] = useState<number | undefined>(undefined);
  const [questionEndedData, setQuestionEndedData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const loadAuthoritativeState = async () => {
    try {
      setLoading(true);
      const state = await api.quizzes.getState(quizId);
      setQuizState(state);

      if (state.status === 'COMPLETED') {
        navigate(`/quizzes/${quizId}/results`);
        return;
      }

      setIsPaused(state.status === 'PAUSED');

      if (state.alreadyAnswered && state.myAnswer) {
        setIsAnswerLocked(true);
        setSubmissionResult(state.myAnswer);
        setSelectedOptionId(state.myAnswer.selectedOptionId);
        setLockedByUserName(state.myAnswer.submitterName);
        setLockedResponseTimeMs(state.myAnswer.responseTimeMs);
      } else {
        setIsAnswerLocked(false);
        setSubmissionResult(null);
        setSelectedOptionId(null);
      }
    } catch (e: any) {
      console.error('Failed to load state', e);
      setErrorMessage(e.message || 'Failed to sync quiz state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthoritativeState();
  }, [quizId]);

  useQuizWebSocket({
    quizId,
    teamId: quizState?.myTeam?.id,
    onEvent: (event: QuizEventMessage) => {
      if (event.eventType === 'QUESTION_STARTED') {
        const { question, questionIndex, totalQuestions, serverStartTimeMs, durationMs } = event.payload;
        setQuizState((prev) =>
          prev
            ? {
                ...prev,
                status: 'QUESTION_ACTIVE',
                currentQuestionIndex: questionIndex,
                totalQuestions: totalQuestions,
                currentQuestion: question,
                serverQuestionStartTimeMs: serverStartTimeMs || Date.now(),
                questionDurationMs: durationMs || (question?.durationSeconds ? question.durationSeconds * 1000 : 15000),
                alreadyAnswered: false,
                myAnswer: undefined,
              }
            : null
        );
        setSelectedOptionId(null);
        setSubmissionResult(null);
        setIsAnswerLocked(false);
        setLockedByUserName(undefined);
        setLockedResponseTimeMs(undefined);
        setQuestionEndedData(null);
        setErrorMessage(null);
        setIsPaused(false);
      } else if (event.eventType === 'QUESTION_ENDED') {
        setQuestionEndedData(event.payload);
        if (event.payload.leaderboard) {
          setQuizState((prev) => (prev ? { ...prev, leaderboard: event.payload.leaderboard } : null));
        }
      } else if (event.eventType === 'TEAM_ANSWER_LOCKED') {
        const teamStatus = event.payload;
        setIsAnswerLocked(true);
        setLockedByUserName(teamStatus.submittedByUserName);
        setLockedResponseTimeMs(teamStatus.responseTimeMs);
      } else if (event.eventType === 'LEADERBOARD_UPDATED') {
        setQuizState((prev) => (prev ? { ...prev, leaderboard: event.payload } : null));
      } else if (event.eventType === 'QUIZ_PAUSED') {
        setIsPaused(true);
      } else if (event.eventType === 'QUIZ_RESUMED') {
        setIsPaused(false);
      } else if (event.eventType === 'QUIZ_COMPLETED') {
        setQuizFinished(true);
        setQuizState((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
        setTimeout(() => {
          navigate(`/quizzes/${quizId}/results`);
        }, 3000);
      }
    },
  });

  const handleSelectAndSubmit = async (optionId: number) => {
    if (isAnswerLocked || submitting || questionEndedData || isPaused) return;

    try {
      setSubmitting(true);
      setSelectedOptionId(optionId);
      setErrorMessage(null);

      const res = await api.quizzes.submitAnswer(quizId, currentQuestion!.id, optionId);
      setSubmissionResult(res);
      setIsAnswerLocked(true);
      setLockedByUserName(user?.fullName || user?.username || 'You');
      setLockedResponseTimeMs(res.responseTimeMs);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to submit answer');
      if (e.message?.includes('already submitted')) {
        setIsAnswerLocked(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Syncing Live Round...
        </span>
      </div>
    );
  }

  if (!quizState) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Quiz Unavailable</h3>
        <p className="text-xs text-slate-500">Could not retrieve live session.</p>
        <button onClick={() => navigate('/quizzes')} className="btn-primary text-xs">
          Return to Quizzes
        </button>
      </div>
    );
  }

  const { currentQuestion, serverQuestionStartTimeMs, questionDurationMs } = quizState;

  // 4 iconic vibrant button themes
  const buttonThemes = [
    {
      bg: 'bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25',
      letterBg: 'bg-white/20 text-white',
      shape: '▲',
      letter: 'A',
    },
    {
      bg: 'bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-500/25',
      letterBg: 'bg-white/20 text-white',
      shape: '◆',
      letter: 'B',
    },
    {
      bg: 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25',
      letterBg: 'bg-white/20 text-white',
      shape: '●',
      letter: 'C',
    },
    {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25',
      letterBg: 'bg-white/20 text-white',
      shape: '■',
      letter: 'D',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6">
      <CheatingDetector quizId={quizId} />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20 shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-black text-slate-900 leading-tight truncate">
              {quizState.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-semibold">
              <span className="truncate">{quizState.mode === 'TEAM' ? 'Team Mode' : 'Solo Mode'}</span>
              <span>•</span>
              <span className="shrink-0 font-bold text-indigo-700">
                Round {quizState.currentQuestionIndex || 1}/{quizState.totalQuestions || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="shrink-0">
          {isPaused ? (
            <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px] sm:text-xs">
              <Pause className="w-3 h-3 fill-amber-700" />
              Paused
            </span>
          ) : (
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Left 2 Cols: Main Game Arena */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {currentQuestion && serverQuestionStartTimeMs && questionDurationMs ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Question Header & Live Timing Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-slate-200/80 space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[11px] sm:text-xs uppercase tracking-wider border border-indigo-100">
                      Q{currentQuestion.displayOrder}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-bold hidden xs:inline">
                      Max {currentQuestion.maxScore} pts
                    </span>
                  </div>

                  <SpeedPointsGauge
                    key={`speed-${currentQuestion.id}-${quizState.currentQuestionIndex}`}
                    maxScore={currentQuestion.maxScore}
                    serverStartTimeMs={serverQuestionStartTimeMs}
                    durationMs={questionDurationMs}
                    isAnswered={isAnswerLocked}
                    scoreAwarded={submissionResult?.scoreAwarded}
                  />
                </div>

                {/* Big Countdown Timer */}
                <CountdownTimer
                  key={`timer-${currentQuestion.id}-${quizState.currentQuestionIndex}`}
                  serverStartTimeMs={serverQuestionStartTimeMs}
                  durationMs={questionDurationMs}
                  isPaused={isPaused}
                />

                {/* Question Text */}
                <div className="pt-1">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                    {currentQuestion.questionText}
                  </h3>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 4 Massive Iconic Answer Cards (Kahoot Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const theme = buttonThemes[idx % buttonThemes.length];
                  const isSelected = selectedOptionId === option.id;
                  const isCorrect = questionEndedData && questionEndedData.correctOptionId === option.id;

                  let customStyle = theme.bg;
                  let ringStyle = 'shadow-lg';

                  if (isAnswerLocked) {
                    if (isSelected) {
                      ringStyle = 'ring-4 ring-offset-2 ring-indigo-500 scale-[1.02] shadow-2xl';
                    } else {
                      customStyle += ' opacity-50 filter grayscale-[30%]';
                    }
                  }

                  if (questionEndedData) {
                    if (isCorrect) {
                      customStyle = 'bg-gradient-to-br from-emerald-500 to-green-600 ring-4 ring-offset-2 ring-emerald-500 shadow-2xl';
                    } else if (isSelected && !isCorrect) {
                      customStyle = 'bg-slate-700 opacity-60';
                    } else {
                      customStyle = 'bg-slate-800 opacity-30';
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAndSubmit(option.id)}
                      disabled={isAnswerLocked || submitting || !!questionEndedData || isPaused}
                      className={`game-btn ${customStyle} ${ringStyle}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                        <span>{theme.shape}</span>
                      </div>

                      <div className="flex-1 font-bold text-base sm:text-lg leading-snug">
                        {option.optionText}
                      </div>

                      {isSelected && (
                        <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      )}

                      {questionEndedData && isCorrect && (
                        <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-md animate-bounce">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Answer Feedback Banner */}
              {isAnswerLocked && !questionEndedData && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-between text-indigo-900 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">
                        Answer Locked In! ⚡
                      </span>
                      <span className="text-[11px] text-indigo-600">
                        Submitted by: <strong>{lockedByUserName || 'You'}</strong>
                      </span>
                    </div>
                  </div>

                  {lockedResponseTimeMs !== undefined && (
                    <span className="font-mono text-xs font-black bg-white px-2.5 py-1 rounded-xl border border-indigo-200 text-indigo-700 shadow-inner">
                      ⏱ {(lockedResponseTimeMs / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              )}

              {/* Question Ended Reveal Card */}
              {questionEndedData && (
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Round Concluded
                    </span>
                    <span className="text-emerald-600 font-extrabold text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Correct: {questionEndedData.correctOptionText}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total</span>
                      <span className="text-base font-extrabold text-slate-900">{questionEndedData.totalAnswers}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block">Correct</span>
                      <span className="text-base font-extrabold text-emerald-700">{questionEndedData.correctCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/60">
                      <span className="text-[10px] font-bold text-rose-600 uppercase block">Wrong</span>
                      <span className="text-base font-extrabold text-rose-700">{questionEndedData.incorrectCount}</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Prompt to Show Results if final question is answered or round ended */}
              {((quizState.currentQuestionIndex >= quizState.totalQuestions && (isAnswerLocked || !!questionEndedData)) || quizFinished || quizState.status === 'COMPLETED') && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 border-2 border-amber-300/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        All Questions Completed! 🏁
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Check out the winner podium and official final standings.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/quizzes/${quizId}/results`)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 fill-white" />
                    <span>Show Results & Leaderboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            (quizFinished || quizState.status === 'COMPLETED' || quizState.currentQuestionIndex >= quizState.totalQuestions) ? (
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-10 text-center text-white space-y-4 sm:space-y-6 shadow-2xl border-2 border-indigo-400/40 animate-in zoom-in-95">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400/20 border-2 border-amber-400/50 flex items-center justify-center mx-auto text-amber-300 shadow-xl shadow-amber-400/10">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/15">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    All {quizState.totalQuestions} Questions Completed!
                  </div>
                  <h3 className="text-xl sm:text-3xl font-black tracking-tight">
                    You've Completed All Questions! 🎉
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 max-w-md mx-auto leading-relaxed">
                    Awesome job! You answered all questions. Check the final leaderboard to see the 1st, 2nd, 3rd podium and full rankings.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate(`/quizzes/${quizId}/results`)}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:from-amber-300 hover:to-orange-500 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-400/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
                  >
                    <Trophy className="w-5 h-5 fill-slate-950" />
                    <span>Show Results & Leaderboard</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Next Question Coming Up...</h3>
                <p className="text-xs text-slate-500">
                  Get ready! The quiz host is about to push the next question.
                </p>
              </div>
            )
          )}

          {/* Team Widget if in Team Mode */}
          {quizState.mode === 'TEAM' && (
            <TeamStatusWidget
              team={quizState.myTeam}
              isAnswerLocked={isAnswerLocked}
              lockedByUserName={lockedByUserName}
              responseTimeMs={lockedResponseTimeMs}
            />
          )}
        </div>

        {/* Right Col: Live Standings */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Live Standings
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {quizState.leaderboard?.length || 0} Listed
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {quizState.leaderboard && quizState.leaderboard.length > 0 ? (
                quizState.leaderboard.map((entry, idx) => {
                  const isMe =
                    (quizState.mode === 'TEAM' && quizState.myTeam?.id === entry.id) ||
                    (quizState.mode === 'INDIVIDUAL' && user?.id === entry.id);

                  let rankBadge = `${idx + 1}`;
                  if (idx === 0) rankBadge = '🥇';
                  if (idx === 1) rankBadge = '🥈';
                  if (idx === 2) rankBadge = '🥉';

                  return (
                    <div
                      key={entry.id}
                      className={`py-3 flex items-center justify-between transition-colors ${
                        isMe ? 'font-bold text-indigo-700 bg-indigo-50/70 -mx-3 px-3 rounded-xl' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-sm font-black w-6 text-center shrink-0">
                          {rankBadge}
                        </span>
                        <span className="truncate font-bold">
                          {entry.name} {isMe && '⭐'}
                        </span>
                      </div>
                      <span className="font-mono font-black tabular-nums shrink-0 ml-2 text-slate-900">
                        {entry.totalScore.toLocaleString()} pts
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  Waiting for first points to be scored...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
