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
                serverQuestionStartTimeMs,
                questionDurationMs: durationMs,
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
      } else if (event.eventType === 'QUIZ_FINISHED') {
        setTimeout(() => {
          navigate(`/quizzes/${quizId}/results`);
        }, 1500);
      }
    },
  });

  const handleSelectAndSubmit = async (optionId: number) => {
    if (isAnswerLocked || submitting || questionEndedData || isPaused) return;
    if (!quizState?.currentQuestion) return;

    setSelectedOptionId(optionId);
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.quizzes.submitAnswer(
        quizId,
        quizState.currentQuestion.id,
        optionId
      );

      setSubmissionResult(res);
      setIsAnswerLocked(true);
      setLockedByUserName(res.submitterName);
      setLockedResponseTimeMs(res.responseTimeMs);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#171717]/20 border-t-[#171717] rounded-full animate-spin" />
        <span className="text-xs font-medium text-[#6B6B6B]">Loading live arena...</span>
      </div>
    );
  }

  if (!quizState) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 ui-card text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#C62828] mx-auto" />
        <h3 className="text-sm font-bold text-[#171717]">Competition Unavailable</h3>
        <p className="text-xs text-[#6B6B6B]">{errorMessage || 'Unable to join arena.'}</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="btn-secondary text-xs"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const { currentQuestion, currentQuestionIndex, totalQuestions, serverQuestionStartTimeMs, questionDurationMs } = quizState;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <CheatingDetector quizId={quizId} />

      {/* Top Competition Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E2]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8] block">
            {quizState.mode === 'TEAM' ? 'Team Competition' : 'Individual Competition'}
          </span>
          <h2 className="text-xl font-bold text-[#171717] tracking-tight">
            {quizState.title}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          {isPaused ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEFCE8] text-[#A16207] border border-[#FEF08A]">
              <Pause className="w-3.5 h-3.5" /> Paused
            </span>
          ) : (
            <span className="font-mono text-xs text-[#6B6B6B] tracking-wider uppercase">
              Round <strong className="text-[#171717]">{currentQuestionIndex}</strong> of {totalQuestions || '?'}
            </span>
          )}

          <div className="h-4 w-[1px] bg-[#E5E5E2]"></div>

          <div className="flex items-center gap-2">
            <span className="text-[#6B6B6B]">Score:</span>
            <span className="font-mono font-bold text-sm text-[#171717] tabular-nums">
              {quizState.myScore}
            </span>
            {quizState.myRank && (
              <span className="text-[10px] text-[#6B6B6B] bg-[#F4F4F1] border border-[#E5E5E2] px-1.5 py-0.5 rounded font-mono">
                #{quizState.myRank}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Question Arena (Left) & Minimal Leaderboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Center / Left: Question Card */}
        <div className="lg:col-span-2 space-y-6">
          {currentQuestion && serverQuestionStartTimeMs && questionDurationMs ? (
            <div className="ui-card p-6 sm:p-8 space-y-6">
              {/* Timer & Speed Value Header */}
              <div className="space-y-4 pb-6 border-b border-[#E5E5E2]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:w-2/3">
                    <CountdownTimer
                      serverStartTimeMs={serverQuestionStartTimeMs}
                      durationMs={questionDurationMs}
                      isPaused={isPaused}
                    />
                  </div>
                  <div>
                    <SpeedPointsGauge
                      maxScore={currentQuestion.maxScore}
                      serverStartTimeMs={serverQuestionStartTimeMs}
                      durationMs={questionDurationMs}
                      isAnswered={isAnswerLocked}
                      scoreAwarded={submissionResult?.scoreAwarded}
                    />
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                  Question {currentQuestion.displayOrder}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#171717] leading-tight">
                  {currentQuestion.questionText}
                </h3>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECDCA] text-[#C62828] text-xs">
                  {errorMessage}
                </div>
              )}

              {/* 2x2 Clean Option Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQuestion.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOptionId === option.id;
                  const isCorrect = questionEndedData && questionEndedData.correctOptionId === option.id;

                  let cardStyle = 'bg-white hover:bg-[#F8F8F6] border-[#E5E5E2] text-[#171717]';

                  if (isSelected) {
                    cardStyle = 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8] font-semibold';
                  }

                  if (questionEndedData) {
                    if (isCorrect) {
                      cardStyle = 'bg-[#ECFDF3] border-[#16803C] text-[#16803C] font-semibold';
                    } else if (isSelected && !isCorrect) {
                      cardStyle = 'bg-[#FEF2F2] border-[#C62828] text-[#C62828]';
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAndSubmit(option.id)}
                      disabled={isAnswerLocked || submitting || !!questionEndedData || isPaused}
                      className={`p-4 rounded-md border text-left flex items-start gap-3 transition-colors disabled:cursor-not-allowed ${cardStyle}`}
                    >
                      <span className="w-6 h-6 rounded bg-[#F4F4F1] border border-[#E5E5E2] flex items-center justify-center font-mono font-bold text-xs text-[#171717] shrink-0">
                        {letter}
                      </span>
                      <span className="text-sm pt-0.5 leading-snug flex-1">{option.optionText}</span>
                      {isSelected && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Answer Locked Message */}
              {isAnswerLocked && (
                <div className="p-3 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] flex items-center justify-between text-xs text-[#171717]">
                  <span>
                    Answer submitted by: <strong>{lockedByUserName || 'You'}</strong>
                  </span>
                  {lockedResponseTimeMs !== undefined && (
                    <span className="font-mono text-[11px] text-[#6B6B6B] font-semibold tabular-nums">
                      {(lockedResponseTimeMs / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              )}

              {/* Question Ended Reveal */}
              {questionEndedData && (
                <div className="p-4 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#171717]">Question Ended</span>
                    <span className="text-[#16803C] font-semibold">
                      Answer: {questionEndedData.correctOptionText}
                    </span>
                  </div>
                  <div className="text-[#6B6B6B] text-[11px] flex items-center gap-4">
                    <span>Received: {questionEndedData.totalAnswers}</span>
                    <span>Correct: {questionEndedData.correctCount}</span>
                    <span>Incorrect: {questionEndedData.incorrectCount}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ui-card p-12 text-center space-y-2">
              <h3 className="text-sm font-bold text-[#171717]">Next Round Starting Soon</h3>
              <p className="text-xs text-[#6B6B6B]">
                The Quiz Master is preparing the next question.
              </p>
            </div>
          )}

          {/* Team Widget if Team Mode */}
          {quizState.mode === 'TEAM' && (
            <TeamStatusWidget
              team={quizState.myTeam}
              isAnswerLocked={isAnswerLocked}
              lockedByUserName={lockedByUserName}
              responseTimeMs={lockedResponseTimeMs}
            />
          )}
        </div>

        {/* Right Col: Leaderboard */}
        <div className="space-y-4">
          <div className="ui-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E2]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Live Standings
              </h4>
              <span className="text-[10px] text-[#6B6B6B] font-mono">
                {quizState.leaderboard?.length || 0} Listed
              </span>
            </div>

            <div className="divide-y divide-[#E5E5E2] text-xs">
              {quizState.leaderboard && quizState.leaderboard.length > 0 ? (
                quizState.leaderboard.map((entry) => {
                  const isMe =
                    (quizState.mode === 'TEAM' && quizState.myTeam?.id === entry.id) ||
                    (quizState.mode === 'INDIVIDUAL' && user?.id === entry.id);

                  return (
                    <div
                      key={entry.id}
                      className={`py-2.5 flex items-center justify-between ${
                        isMe ? 'font-semibold text-[#1D4ED8]' : 'text-[#171717]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-mono text-[11px] text-[#6B6B6B] w-5">
                          {String(entry.rank).padStart(2, '0')}
                        </span>
                        <span className="truncate">
                          {entry.name} {isMe && '(You)'}
                        </span>
                      </div>
                      <span className="font-mono font-bold tabular-nums shrink-0 ml-2">
                        {entry.totalScore.toLocaleString()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-[#6B6B6B]">
                  No scores recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
