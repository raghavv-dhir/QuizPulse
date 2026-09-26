import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { QuizSummary, QuizMode, ScoringStrategyType } from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Play,
  Trash2,
  X,
  FileText,
  Sparkles,
  Zap,
  Users,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { toGamePin } from '../utils/gamePin';

export const AdminDashboardPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exemplarLoading, setExemplarLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Create Quiz Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<QuizMode>('TEAM');
  const [duration, setDuration] = useState(15);
  const [maxScore, setMaxScore] = useState(1000);
  const [scoringStrategy, setScoringStrategy] = useState<ScoringStrategyType>('LINEAR');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.quizzes.list();
      setQuizzes(data);
    } catch (e) {
      console.error('Failed to load quizzes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleCreateExemplarQuiz = async () => {
    try {
      setExemplarLoading(true);
      const created = await api.admin.createQuiz({
        title: 'Global Tech & Science Speed Showdown 2026',
        description: 'High-energy live quiz testing computer science, algorithms, networking, and modern tech.',
        mode: 'TEAM',
        defaultQuestionDurationSeconds: 15,
        maxScorePerQuestion: 1000,
        scoringStrategy: 'LINEAR',
        negativeMarking: false,
        negativePoints: 0,
        immediateFeedback: true,
        allowReconnection: true,
      });

      const sampleQuestions = [
        {
          questionText: 'What is the worst-case time complexity of quicksort when using deterministic last-element pivoting on already-sorted input?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 1,
          options: [
            { optionText: 'O(n log n)', isCorrect: false, displayOrder: 1 },
            { optionText: 'O(n²)', isCorrect: true, displayOrder: 2 },
            { optionText: 'O(n)', isCorrect: false, displayOrder: 3 },
            { optionText: 'O(log n)', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'Which HTTP status code is standardized for client-side API Rate Limiting violations?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 2,
          options: [
            { optionText: '403 Forbidden', isCorrect: false, displayOrder: 1 },
            { optionText: '429 Too Many Requests', isCorrect: true, displayOrder: 2 },
            { optionText: '503 Service Unavailable', isCorrect: false, displayOrder: 3 },
            { optionText: '408 Request Timeout', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'What consensus protocol is natively utilized by etcd and HashiCorp Consul to coordinate distributed cluster state?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 3,
          options: [
            { optionText: 'Paxos', isCorrect: false, displayOrder: 1 },
            { optionText: 'Raft', isCorrect: true, displayOrder: 2 },
            { optionText: 'Proof of Stake', isCorrect: false, displayOrder: 3 },
            { optionText: 'Two-Phase Commit', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'In PostgreSQL, which index type is specifically optimized for full-text search and array containment queries?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 4,
          options: [
            { optionText: 'B-Tree', isCorrect: false, displayOrder: 1 },
            { optionText: 'GIN (Generalized Inverted Index)', isCorrect: true, displayOrder: 2 },
            { optionText: 'Hash Index', isCorrect: false, displayOrder: 3 },
            { optionText: 'BRIN (Block Range Index)', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'During a standard TCP 3-way handshake, what packet does the server reply with upon receiving the client SYN?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 5,
          options: [
            { optionText: 'SYN-ACK', isCorrect: true, displayOrder: 1 },
            { optionText: 'ACK only', isCorrect: false, displayOrder: 2 },
            { optionText: 'FIN-ACK', isCorrect: false, displayOrder: 3 },
            { optionText: 'RST packet', isCorrect: false, displayOrder: 4 },
          ],
        },
      ];

      for (const q of sampleQuestions) {
        await api.questions.add(created.id, q);
      }

      navigate(`/admin/quizzes/${created.id}/control`);
    } catch (err: any) {
      alert(err.message || 'Failed to create exemplar quiz');
    } finally {
      setExemplarLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreateLoading(true);
      setError(null);
      const created = await api.admin.createQuiz({
        title: title.trim(),
        description: description.trim(),
        mode,
        defaultQuestionDurationSeconds: duration,
        maxScorePerQuestion: maxScore,
        scoringStrategy,
        negativeMarking: false,
        negativePoints: 0,
        immediateFeedback: true,
        allowReconnection: true,
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      navigate(`/admin/quizzes/${created.id}/control`);
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm('Are you sure you want to delete this competition?')) return;
    try {
      await api.admin.deleteQuiz(id);
      loadQuizzes();
    } catch (e) {
      alert('Failed to delete quiz');
    }
  };

  const totalParticipants = quizzes.reduce((acc, q) => acc + q.participantCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
            <Shield className="w-3.5 h-3.5" />
            <span>Host Controls</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Host Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Create new quizzes, launch live game rooms, and control question rounds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateExemplarQuiz}
            disabled={exemplarLoading}
            className="btn-secondary text-xs !border-indigo-200 !bg-indigo-50 !text-indigo-700 hover:!bg-indigo-100/80 transition"
          >
            {exemplarLoading ? (
              <span className="w-4 h-4 border-2 border-indigo-700/30 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-600" />
            )}
            <span>{exemplarLoading ? 'Generating...' : '⚡ Quick Demo Quiz'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create a Quiz</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Quizzes
          </span>
          <span className="text-3xl font-black text-slate-900 font-mono">
            {quizzes.length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Players
          </span>
          <span className="text-3xl font-black text-slate-900 font-mono">
            {totalParticipants}
          </span>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">Your Quizzes</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="ui-card p-6 h-48 animate-pulse bg-white" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-200 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Quizzes Created Yet</h3>
            <p className="text-xs text-slate-500">
              Generate a ready-to-run demo quiz with 1 click, or create a custom one from scratch.
            </p>
            <button
              onClick={handleCreateExemplarQuiz}
              className="btn-primary text-xs !h-10 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Quick Demo Quiz</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-black tracking-wide">
                      PIN: {toGamePin(quiz.id)}
                    </span>
                    <span className="badge bg-slate-100 text-slate-700">
                      {quiz.mode === 'TEAM' ? 'Team Mode' : 'Solo Mode'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {quiz.description || 'Live speed-based competition.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>{quiz.questionCount} Questions</span>
                    <span>{quiz.participantCount} Players</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/quizzes/${quiz.id}/control`}
                      className="btn-primary flex-1 text-xs justify-center !h-10"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Host Control Room</span>
                    </Link>

                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      title="Delete Quiz"
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simple Create Quiz Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create New Quiz</h3>
                <p className="text-xs text-slate-500">Configure your live competition room</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Trivia Showdown 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 rounds of high-speed science questions"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('TEAM')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        mode === 'TEAM'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('INDIVIDUAL')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        mode === 'INDIVIDUAL'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Solo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Question Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="ui-input w-full text-xs"
                  >
                    <option value={10}>10 Seconds (Ultra-Fast)</option>
                    <option value={15}>15 Seconds (Standard)</option>
                    <option value={20}>20 Seconds</option>
                    <option value={30}>30 Seconds (Relaxed)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary flex-1"
                >
                  {createLoading ? 'Creating...' : 'Create & Add Questions ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
