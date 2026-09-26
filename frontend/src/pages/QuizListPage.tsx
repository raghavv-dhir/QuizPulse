import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { QuizSummary } from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Users,
  Trophy,
  ArrowRight,
  Shield,
  Search,
  Sparkles,
  Key,
  Play,
  Clock,
} from 'lucide-react';

export const QuizListPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE' | 'LOBBY' | 'COMPLETED'>('ALL');
  const [gamePin, setGamePin] = useState('');
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

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

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = gamePin.trim().replace(/^#/, '');
    if (!clean) return;
    navigate(`/quizzes/${clean}/lobby`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
      case 'QUESTION_ACTIVE':
        return (
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-600 -ml-3.5" />
            Live Now
          </span>
        );
      case 'LOBBY':
      case 'REGISTRATION_OPEN':
        return (
          <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Lobby Open
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
            Finished
          </span>
        );
      default:
        return (
          <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
            Upcoming
          </span>
        );
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'LIVE') {
      return q.status === 'RUNNING' || q.status === 'QUESTION_ACTIVE';
    }
    if (activeFilter === 'LOBBY') {
      return q.status === 'LOBBY' || q.status === 'REGISTRATION_OPEN';
    }
    if (activeFilter === 'COMPLETED') {
      return q.status === 'COMPLETED';
    }
    return true;
  });

  const cardAccents = [
    'from-rose-500 to-red-500',
    'from-indigo-500 to-blue-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-purple-500 to-indigo-500',
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-canvas pt-12 pb-16 px-4 sm:px-6 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-200/80 shadow-sm text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Real-Time Speed Competition Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Fast, Energetic <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Live Quiz Battles
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Answer questions quickly for maximum bonus points. Compete solo or form teams with friends in live synchronized rounds.
          </p>

          {/* Big Game PIN Input Box */}
          <div className="pt-2 max-w-md mx-auto">
            <form
              onSubmit={handleJoinPin}
              className="bg-white p-2.5 rounded-2xl shadow-xl shadow-indigo-500/10 border-2 border-indigo-200 flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="relative w-full flex-1">
                <Key className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter Game PIN or Quiz ID..."
                  value={gamePin}
                  onChange={(e) => setGamePin(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-transparent text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal text-sm sm:text-base outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
              >
                <span>Join Game</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 max-w-2xl mx-auto text-left">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Speed Scoring</h4>
                <p className="text-[11px] text-slate-500 font-medium">Faster answers = more points</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Teams & Solo</h4>
                <p className="text-[11px] text-slate-500 font-medium">100 teams or solo rivals</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Live Leaderboard</h4>
                <p className="text-[11px] text-slate-500 font-medium">Real-time dynamic podiums</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Quizzes List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Active & Public Quizzes
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Join an open room or browse past competition results.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="btn-primary text-xs !h-10"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Host Dashboard</span>
              </Link>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ui-input w-full !h-10 !pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['ALL', 'LIVE', 'LOBBY', 'COMPLETED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === filter
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {filter === 'ALL' && 'All Quizzes'}
              {filter === 'LIVE' && '🔥 Live Now'}
              {filter === 'LOBBY' && '⏳ Lobby Open'}
              {filter === 'COMPLETED' && '🏆 Finished'}
            </button>
          ))}
        </div>

        {/* Grid of Quizzes */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="ui-card p-6 h-52 animate-pulse bg-white" />
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="ui-card p-12 text-center space-y-3 bg-white max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Play className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Quizzes Found</h3>
            <p className="text-xs text-slate-500">
              There are no competitions matching your search. Create one from the Host Dashboard!
            </p>
            {isAdmin && (
              <Link to="/admin" className="btn-primary text-xs !h-9 inline-flex">
                Create First Quiz
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz, idx) => {
              const accentGradient = cardAccents[idx % cardAccents.length];

              return (
                <div
                  key={quiz.id}
                  className="ui-card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-indigo-300"
                >
                  {/* Top colorful accent stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accentGradient}`} />

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        {quiz.mode === 'TEAM' ? (
                          <>
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            Team Mode
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-rose-500" />
                            Solo Mode
                          </>
                        )}
                      </span>
                      {getStatusBadge(quiz.status)}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {quiz.description || 'Fast-paced real-time competition.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.questionCount} Questions
                      </span>
                      <span>{quiz.participantCount} Players</span>
                      {quiz.mode === 'TEAM' && <span>{quiz.teamCount} Teams</span>}
                    </div>

                    {quiz.status === 'COMPLETED' ? (
                      <Link
                        to={`/quizzes/${quiz.id}/results`}
                        className="btn-secondary w-full text-xs justify-center"
                      >
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>View Podium & Standings</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/quizzes/${quiz.id}/lobby`}
                        className="btn-primary w-full text-xs justify-center !h-11 shadow-md shadow-indigo-500/20"
                      >
                        <span>Join Game</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
