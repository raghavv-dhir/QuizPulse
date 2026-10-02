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
  StopCircle,
  Pause,
  RotateCcw,
  Download,
  Plus,
  Check,
  X,
  Copy,
  Users,
  Trophy,
  Sparkles,
  Zap,
  Edit2,
  Trash2,
} from 'lucide-react';
import { toGamePin } from '../utils/gamePin';

export const QuizControlRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'questions' | 'teams'>('control');
  const [copiedLink, setCopiedLink] = useState(false);

  // Live round state
  const [currentSessionData, setCurrentSessionData] = useState<any | null>(null);
  const [questionStats, setQuestionStats] = useState<{
    totalAnswers: number;
    correctCount: number;
    incorrectCount: number;
  }>({ totalAnswers: 0, correctCount: 0, incorrectCount: 0 });

  // Add/Edit Question Modal
  const [isAddQuestionModal, setIsAddQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
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
      } else if (
        event.eventType === 'PARTICIPANT_JOINED' ||
        event.eventType === 'PARTICIPANT_LEFT' ||
        event.eventType === 'TEAM_CREATED' ||
        event.eventType === 'PARTICIPANT_CHEATING_ALERT' ||
        event.eventType === 'PARTICIPANT_DISQUALIFIED'
      ) {
        loadData();
      }
    },
  });

  const handleAction = async (actionFn: () => Promise<any>) => {
    try {
      setActionLoading(true);
      await actionFn();
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setCorrectOptIdx(1);
    setDurationSec(quiz?.defaultQuestionDurationSeconds || 15);
    setMaxPts(quiz?.maxScorePerQuestion || 1000);
    setIsAddQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.questionText || '');
    setDurationSec(q.durationSeconds || 15);
    setMaxPts(q.maxScore || 1000);

    const sortedOpts = [...(q.options || [])].sort((a, b) => a.displayOrder - b.displayOrder);
    setOpt1(sortedOpts[0]?.optionText || '');
    setOpt2(sortedOpts[1]?.optionText || '');
    setOpt3(sortedOpts[2]?.optionText || '');
    setOpt4(sortedOpts[3]?.optionText || '');

    const correctIdx = sortedOpts.findIndex((o) => o.isCorrect);
    setCorrectOptIdx(correctIdx >= 0 ? correctIdx + 1 : 1);

    setIsAddQuestionModal(true);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !opt1.trim() || !opt2.trim()) {
      alert('Question and at least 2 options are required');
      return;
    }

    const options = [
      { optionText: opt1.trim(), isCorrect: correctOptIdx === 1, displayOrder: 1 },
      { optionText: opt2.trim(), isCorrect: correctOptIdx === 2, displayOrder: 2 },
    ];
    if (opt3.trim()) {
      options.push({ optionText: opt3.trim(), isCorrect: correctOptIdx === 3, displayOrder: 3 });
    }
    if (opt4.trim()) {
      options.push({ optionText: opt4.trim(), isCorrect: correctOptIdx === 4, displayOrder: 4 });
    }

    try {
      setActionLoading(true);
      if (editingQuestionId) {
        const currentQ = quiz?.questions?.find((q) => q.id === editingQuestionId);
        await api.questions.update(editingQuestionId, {
          questionText: questionText.trim(),
          durationSeconds: durationSec,
          maxScore: maxPts,
          displayOrder: currentQ?.displayOrder || 1,
          options,
        });
      } else {
        await api.questions.add(quizId, {
          questionText: questionText.trim(),
          durationSeconds: durationSec,
          maxScore: maxPts,
          displayOrder: (quiz?.questions?.length || 0) + 1,
          options,
        });
      }

      setIsAddQuestionModal(false);
      setEditingQuestionId(null);
      setQuestionText('');
      setOpt1('');
      setOpt2('');
      setOpt3('');
      setOpt4('');
      setCorrectOptIdx(1);
      loadData();
    } catch (err: any) {
      alert(err.message || (editingQuestionId ? 'Failed to update question' : 'Failed to add question'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      setActionLoading(true);
      await api.questions.delete(qId);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete question');
    } finally {
      setActionLoading(false);
    }
  };

  const copyInviteLink = () => {
    const gamePin = toGamePin(quizId);
    const url = `${window.location.origin}/quizzes/${gamePin}/lobby`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading Control Stage...
        </span>
      </div>
    );
  }

  const isLive = quiz.status === 'RUNNING' || quiz.status === 'QUESTION_ACTIVE' || quiz.status === 'PAUSED';
  const isQuestionActive = quiz.status === 'QUESTION_ACTIVE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Host Command Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black font-mono tracking-wider border border-indigo-100">
                PIN: {toGamePin(quiz.id)}
              </span>
              <span className="badge bg-slate-100 text-slate-700">
                {quiz.mode === 'TEAM' ? 'Team Mode' : 'Solo Mode'}
              </span>
              <span className={`badge ${isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {isLive ? '● Live Stage Active' : quiz.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {quiz.title}
            </h1>
            <p className="text-xs text-slate-500">
              Questions: <strong>{quiz.questions?.length || 0}</strong> • Registered Players: <strong>{quiz.participantCount}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyInviteLink}
              className="btn-secondary text-xs !h-11"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied Player Link!' : 'Share Player Link'}</span>
            </button>

            {/* Launch / Start / Next Question Controls */}
            {(quiz.status === 'LOBBY' || quiz.status === 'REGISTRATION_OPEN' || quiz.status === 'DRAFT') && (
              <button
                disabled={actionLoading || !quiz.questions || quiz.questions.length === 0}
                onClick={() => handleAction(() => api.admin.startQuiz(quizId))}
                className="btn-primary text-xs !h-11 shadow-md shadow-indigo-500/25 !px-6"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START QUIZ 🚀</span>
              </button>
            )}

            {isLive && (
              <>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-indigo-600 -ml-3" />
                  <span>
                    {quiz.status === 'QUESTION_ENDED'
                      ? '⏱ Auto-advancing to next question...'
                      : '⚡ Auto-Timer Enabled'}
                  </span>
                </div>

                {isQuestionActive && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction(() => api.admin.endQuestion(quizId))}
                    className="btn-secondary text-xs !h-11 !bg-sky-50 !border-sky-200 !text-sky-700 hover:!bg-sky-100"
                    title="Manually reveal answer before timer runs out"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Reveal Early 👁</span>
                  </button>
                )}

                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(() => api.admin.finishQuiz(quizId))}
                  className="btn-secondary text-xs !h-11 !text-rose-600 !border-rose-200 hover:!bg-rose-50"
                >
                  <span>Finish & Podium 🏆</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'control'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎮 Live Stage View
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📝 Questions ({quiz.questions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'teams'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            👥 Standings & Teams ({leaderboard.length})
          </button>
        </div>
      </div>

      {/* Tab Content: Live Stage */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {currentSessionData?.question ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs uppercase tracking-wider">
                    Question {currentSessionData.questionIndex || 1} of {currentSessionData.totalQuestions || quiz.questions?.length}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Max {currentSessionData.question.maxScore} pts
                  </span>
                </div>

                <CountdownTimer
                  serverStartTimeMs={currentSessionData.serverStartTimeMs}
                  durationMs={currentSessionData.durationMs}
                />

                <div className="pt-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-snug">
                    {currentSessionData.question.questionText}
                  </h3>
                </div>

                {/* Question Live Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Answers</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{questionStats.totalAnswers}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase block">Correct</span>
                    <span className="text-xl font-black text-emerald-700 font-mono">{questionStats.correctCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                    <span className="text-[10px] font-bold text-rose-600 uppercase block">Incorrect</span>
                    <span className="text-xl font-black text-rose-700 font-mono">{questionStats.incorrectCount}</span>
                  </div>
                </div>

                {/* Option List with Correct indicator */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 block">Options:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentSessionData.question.options.map((opt: any, i: number) => (
                      <div
                        key={opt.id || i}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{opt.optionText}</span>
                        {opt.isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-200 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                  <Play className="w-7 h-7 fill-indigo-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Stage Ready</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {quiz.questions && quiz.questions.length > 0
                      ? `Click "START QUIZ" to push Question 1 to all connected players.`
                      : 'Add questions in the "Questions" tab before starting the game.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Mini Leaderboard */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Live Standings
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {leaderboard.length} Teams
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {leaderboard.map((entry, idx) => (
                <div key={entry.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <span className="font-bold text-slate-800 truncate">{entry.name}</span>
                  </div>
                  <span className="font-mono font-black tabular-nums text-indigo-600 ml-2">
                    {entry.totalScore.toLocaleString()}
                  </span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No scores recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Questions */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900">Quiz Questions</h3>
              <p className="text-xs text-slate-500">Add or manage multiple choice questions</p>
            </div>
            <button
              onClick={handleOpenAddQuestion}
              className="btn-primary text-xs !h-10"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {quiz.questions?.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                    Question {idx + 1} ({q.durationSeconds}s • {q.maxScore} pts)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition flex items-center gap-1 cursor-pointer"
                      title="Edit this previously set question"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Question</span>
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900">{q.questionText}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options?.map((opt: any, oIdx: number) => (
                    <div
                      key={opt.id || oIdx}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{opt.optionText}</span>
                      {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Standings / Teams */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900">Current Leaderboard</h3>
              <p className="text-xs text-slate-500">Live rankings and response speed averages</p>
            </div>
            <Link
              to={`/quizzes/${quizId}/results`}
              className="btn-secondary text-xs !h-9"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Full Podium View</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Participant / Team</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Correct</th>
                  <th className="py-3 px-4 text-right">Avg Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{entry.name}</td>
                    <td className="py-3 px-4 text-center font-mono font-black text-indigo-600">
                      {entry.totalScore.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                      {entry.correctAnswers}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {(entry.averageResponseTimeMs / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {isAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingQuestionId ? 'Edit Previously Set Question' : 'Add New Question'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingQuestionId
                    ? 'Modify question prompt, timer, points, or options below'
                    : 'Configure question text, time limit, and choices'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddQuestionModal(false);
                  setEditingQuestionId(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question Text *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which planet is closest to the sun?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                  <select
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                    className="ui-input w-full text-xs"
                  >
                    <option value={10}>10 Seconds</option>
                    <option value={15}>15 Seconds</option>
                    <option value={20}>20 Seconds</option>
                    <option value={30}>30 Seconds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Points</label>
                  <input
                    type="number"
                    value={maxPts}
                    onChange={(e) => setMaxPts(Number(e.target.value))}
                    className="ui-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Options (Select the radio button for the correct answer)
                </label>

                {[
                  { val: opt1, set: setOpt1, idx: 1, label: 'Option A *' },
                  { val: opt2, set: setOpt2, idx: 2, label: 'Option B *' },
                  { val: opt3, set: setOpt3, idx: 3, label: 'Option C (Optional)' },
                  { val: opt4, set: setOpt4, idx: 4, label: 'Option D (Optional)' },
                ].map((item) => (
                  <div key={item.idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptIdx === item.idx}
                      onChange={() => setCorrectOptIdx(item.idx)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder={item.label}
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className="ui-input flex-1 !h-10 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionModal(false)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary flex-1 text-xs"
                >
                  {editingQuestionId ? 'Save Changes to Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
