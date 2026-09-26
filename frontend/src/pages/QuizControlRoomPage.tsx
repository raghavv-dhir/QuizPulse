import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  QuizDetail,
  LeaderboardEntry,
  QuizEventMessage,
} from '../types/quiz';
import { useQuizWebSocket } from '../hooks/useQuizWebSocket';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  Play,
  SkipForward,
  StopCircle,
  Pause,
  RotateCcw,
  Download,
  Plus,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

export const QuizControlRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'questions' | 'teams' | 'audit'>('control');

  // Live round state
  const [currentSessionData, setCurrentSessionData] = useState<any | null>(null);
  const [questionStats, setQuestionStats] = useState<{
    totalAnswers: number;
    correctCount: number;
    incorrectCount: number;
  }>({ totalAnswers: 0, correctCount: 0, incorrectCount: 0 });

  // Add Question Modal
  const [isAddQuestionModal, setIsAddQuestionModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [durationSec, setDurationSec] = useState(15);
  const [maxPts, setMaxPts] = useState(1000);
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctOptIdx, setCorrectOptIdx] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const q = await api.quizzes.get(quizId);
      setQuiz(q);
      const lb = await api.quizzes.getLeaderboard(quizId);
      setLeaderboard(lb);
      const logs = await api.admin.getAuditLogs(quizId);
      setAuditLogs(logs);

      const state = await api.quizzes.getState(quizId);
      if (state.currentQuestion && state.serverQuestionStartTimeMs && state.questionDurationMs) {
        setCurrentSessionData({
          question: state.currentQuestion,
          questionIndex: state.currentQuestionIndex,
          totalQuestions: state.totalQuestions,
          serverStartTimeMs: state.serverQuestionStartTimeMs,
          durationMs: state.questionDurationMs,
        });
      }
    } catch (e) {
      console.error('Failed to load control room data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  useQuizWebSocket({
    quizId,
    onEvent: (event: QuizEventMessage) => {
      if (event.eventType === 'QUESTION_STARTED') {
        setCurrentSessionData(event.payload);
        setQuestionStats({ totalAnswers: 0, correctCount: 0, incorrectCount: 0 });
        loadData();
      } else if (event.eventType === 'QUESTION_ENDED') {
        setQuestionStats({
          totalAnswers: event.payload.totalAnswers || 0,
          correctCount: event.payload.correctCount || 0,
          incorrectCount: event.payload.incorrectCount || 0,
        });
        if (event.payload.leaderboard) {
          setLeaderboard(event.payload.leaderboard);
        }
        loadData();
      } else if (event.eventType === 'LEADERBOARD_UPDATED') {
        setLeaderboard(event.payload);
      } else if (event.eventType === 'QUIZ_STARTED' || event.eventType === 'QUIZ_FINISHED') {
        loadData();
      }
    },
  });

  const handleAction = async (actionFn: () => Promise<any>) => {
    try {
      setActionLoading(true);
      await actionFn();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !opt1.trim() || !opt2.trim()) return;

    try {
      setActionLoading(true);
      await api.questions.add(quizId, {
        questionText: questionText.trim(),
        durationSeconds: durationSec,
        maxScore: maxPts,
        options: [
          { optionText: opt1.trim(), isCorrect: correctOptIdx === 1, displayOrder: 1 },
          { optionText: opt2.trim(), isCorrect: correctOptIdx === 2, displayOrder: 2 },
          { optionText: opt3.trim() || 'Option C', isCorrect: correctOptIdx === 3, displayOrder: 3 },
          { optionText: opt4.trim() || 'Option D', isCorrect: correctOptIdx === 4, displayOrder: 4 },
        ],
      });

      setIsAddQuestionModal(false);
      setQuestionText('');
      setOpt1('');
      setOpt2('');
      setOpt3('');
      setOpt4('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to add question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/admin/quizzes/${quizId}/export`, '_blank');
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#171717]/20 border-t-[#171717] rounded-full animate-spin" />
        <span className="text-xs font-medium text-[#6B6B6B]">Loading console...</span>
      </div>
    );
  }

  const isLive = quiz.status === 'RUNNING' || quiz.status === 'QUESTION_ACTIVE';
  const isQuestionActive = quiz.status === 'QUESTION_ACTIVE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Console Operations Header */}
      <div className="ui-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Master Console
              </span>
              <span className="text-[#E5E5E2]">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#171717]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? 'bg-[#16803C]' : 'bg-[#A16207]'
                  }`}
                />
                {quiz.status}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
              {quiz.title}
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Mode: <strong>{quiz.mode}</strong> · Questions: <strong>{quiz.questions?.length || 0}</strong> · Registered: <strong>{quiz.participantCount}</strong>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {quiz.status === 'DRAFT' && (
              <button
                disabled={actionLoading}
                onClick={() => handleAction(() => api.admin.openRegistration(quizId))}
                className="btn-secondary text-xs !h-9"
              >
                Open Registration
              </button>
            )}

            {(quiz.status === 'DRAFT' || quiz.status === 'REGISTRATION_OPEN') && (
              <button
                disabled={actionLoading}
                onClick={() => handleAction(() => api.admin.openLobby(quizId))}
                className="btn-secondary text-xs !h-9"
              >
                Open Lobby
              </button>
            )}

            {(quiz.status === 'LOBBY' || quiz.status === 'REGISTRATION_OPEN' || quiz.status === 'DRAFT') && (
              <button
                disabled={actionLoading || !quiz.questions || quiz.questions.length === 0}
                onClick={() => handleAction(() => api.admin.startQuiz(quizId))}
                className="btn-primary text-xs !h-9"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Competition</span>
              </button>
            )}

            {isLive && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(() => api.admin.nextQuestion(quizId))}
                  className="btn-primary text-xs !h-9"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Next Question</span>
                </button>

                {isQuestionActive && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction(() => api.admin.endQuestion(quizId))}
                    className="btn-secondary text-xs !h-9"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Reveal Answer</span>
                  </button>
                )}

                {quiz.status === 'PAUSED' ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction(() => api.admin.resumeQuiz(quizId))}
                    className="btn-secondary text-xs !h-9"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction(() => api.admin.pauseQuiz(quizId))}
                    className="btn-secondary text-xs !h-9"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(() => api.admin.finishQuiz(quizId))}
                  className="btn-secondary text-xs !h-9 text-[#C62828] hover:border-[#C62828]"
                >
                  Finish
                </button>
              </>
            )}

            <button
              onClick={handleExportCsv}
              className="btn-secondary text-xs !h-9"
              title="Export Standings CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Clean Sub-navigation */}
        <div className="flex items-center gap-1 pt-3 border-t border-[#E5E5E2] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'control'
                ? 'bg-[#171717] text-white'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'questions'
                ? 'bg-[#171717] text-white'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Questions ({quiz.questions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'teams'
                ? 'bg-[#171717] text-white'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Teams ({quiz.teams?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'audit'
                ? 'bg-[#171717] text-white'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Security Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Tab: Live Monitor */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Active Question & Metrics Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="ui-card p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2] text-xs">
                <span className="font-bold uppercase tracking-wider text-[#6B6B6B]">
                  Active Question Monitor
                </span>
                <span className="font-mono text-[#171717]">
                  Round {quiz.currentQuestionIndex} / {quiz.questions?.length || 0}
                </span>
              </div>

              {currentSessionData?.question ? (
                <div className="space-y-5">
                  <CountdownTimer
                    serverStartTimeMs={currentSessionData.serverStartTimeMs}
                    durationMs={currentSessionData.durationMs}
                    isPaused={quiz.status === 'PAUSED'}
                  />

                  <h3 className="text-xl font-bold text-[#171717]">
                    {currentSessionData.question.questionText}
                  </h3>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentSessionData.question.options.map((opt: any, i: number) => (
                      <div
                        key={opt.id}
                        className="p-3 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] flex items-center gap-2"
                      >
                        <span className="font-mono font-bold text-[#6B6B6B]">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="font-medium text-[#171717]">{opt.optionText}</span>
                      </div>
                    ))}
                  </div>

                  {/* Operational Metrics Row (Section 10) */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E5E2]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
                        Received
                      </span>
                      <span className="text-2xl font-extrabold text-[#171717] font-mono tabular-nums">
                        {questionStats.totalAnswers}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#16803C] block">
                        Correct
                      </span>
                      <span className="text-2xl font-extrabold text-[#16803C] font-mono tabular-nums">
                        {questionStats.correctCount}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C62828] block">
                        Incorrect
                      </span>
                      <span className="text-2xl font-extrabold text-[#C62828] font-mono tabular-nums">
                        {questionStats.incorrectCount}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#6B6B6B]">
                  No round active. Click <strong>Start Competition</strong> or <strong>Next Question</strong>.
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Standings */}
          <div className="ui-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E2]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Live Standings
              </h4>
              <span className="text-[10px] text-[#6B6B6B] font-mono">
                {leaderboard.length} Ranked
              </span>
            </div>

            <div className="divide-y divide-[#E5E5E2] text-xs">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className="py-2 flex items-center justify-between text-[#171717]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[11px] text-[#6B6B6B] w-5">
                      {String(entry.rank).padStart(2, '0')}
                    </span>
                    <span className="font-medium truncate">{entry.name}</span>
                  </div>
                  <span className="font-mono font-bold tabular-nums">
                    {entry.totalScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Questions */}
      {activeTab === 'questions' && (
        <div className="ui-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
            <h3 className="text-sm font-bold text-[#171717]">
              Questions ({quiz.questions?.length || 0})
            </h3>
            <button
              onClick={() => setIsAddQuestionModal(true)}
              className="btn-primary text-xs !h-8 !px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-3">
            {quiz.questions?.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#6B6B6B]">
                    Question {idx + 1} ({q.durationSeconds}s · max {q.maxScore} pts)
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#171717]">{q.questionText}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options?.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded border flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-[#ECFDF3] border-[#A6F4C5] text-[#16803C] font-semibold'
                          : 'bg-white border-[#E5E5E2] text-[#4A4A4A]'
                      }`}
                    >
                      <span>{opt.optionText}</span>
                      {opt.isCorrect && <Check className="w-3.5 h-3.5 text-[#16803C]" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Teams */}
      {activeTab === 'teams' && (
        <div className="ui-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#171717]">Registered Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quiz.teams?.map((team) => (
              <div key={team.id} className="p-4 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#171717] text-sm">{team.name}</h4>
                  <span className="font-mono text-xs text-[#6B6B6B]">CODE: {team.code}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-[#6B6B6B] font-semibold uppercase">Members:</span>
                  {team.members?.map((m) => (
                    <div key={m.id} className="text-[#171717] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16803C]"></span>
                      <span>{m.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Security Logs */}
      {activeTab === 'audit' && (
        <div className="ui-card p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#171717]">Security & Integrity Audit Logs</h3>
            <p className="text-xs text-[#6B6B6B]">
              Tracks visibility changes and browser tab switches during live question rounds.
            </p>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B6B6B]">
                No security violations logged.
              </div>
            ) : (
              auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-[#A16207] mr-2">[{log.eventType}]</span>
                    <span className="text-[#171717]">
                      {log.user?.fullName} (@{log.user?.username}) — {log.details}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#6B6B6B]">
                    {new Date(log.occurredAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {isAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="ui-card p-6 sm:p-7 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-modal">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
              <h3 className="text-base font-bold text-[#171717]">Add Question</h3>
              <button onClick={() => setIsAddQuestionModal(false)} className="text-[#6B6B6B] hover:text-[#171717]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Question Text</label>
                <textarea
                  rows={2}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. What is the complexity of Quicksort in average case?"
                  className="ui-input w-full !h-20 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">Duration (sec)</label>
                  <input
                    type="number"
                    min={5}
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                    className="ui-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">Max Score</label>
                  <input
                    type="number"
                    min={100}
                    value={maxPts}
                    onChange={(e) => setMaxPts(Number(e.target.value))}
                    className="ui-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-[#171717]">
                  Options (select the radio of the correct choice):
                </label>
                {[
                  { val: opt1, set: setOpt1, idx: 1, label: 'A' },
                  { val: opt2, set: setOpt2, idx: 2, label: 'B' },
                  { val: opt3, set: setOpt3, idx: 3, label: 'C' },
                  { val: opt4, set: setOpt4, idx: 4, label: 'D' },
                ].map((item) => (
                  <div key={item.idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptIdx === item.idx}
                      onChange={() => setCorrectOptIdx(item.idx)}
                      className="text-[#1D4ED8] focus:ring-0"
                    />
                    <input
                      type="text"
                      required={item.idx <= 2}
                      placeholder={`Option ${item.label}`}
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className="ui-input flex-1 !h-9 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E5E5E2] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
