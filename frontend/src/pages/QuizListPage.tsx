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
import { toGamePin, parsePinToId } from '../utils/gamePin';
import { TeamPromptModal } from '../components/TeamPromptModal';

export const QuizListPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE' | 'LOBBY' | 'COMPLETED'>('ALL');
  const [gamePin, setGamePin] = useState('');
  const [selectedTeamQuiz, setSelectedTeamQuiz] = useState<{ id: number; title: string } | null>(null);
  const [checkingTeamQuizId, setCheckingTeamQuizId] = useState<number | null>(null);
  const { user, isAdmin } = useAuth();
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

  useEffect(() => {
    if (window.location.hash === '#explore-quizzes') {
      setTimeout(() => {
        const el = document.getElementById('explore-quizzes');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [loading]);

  const handleJoinPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const quizId = parsePinToId(gamePin);
    if (!quizId) {
      alert('Please enter a valid Game PIN or Quiz ID');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const q = await api.quizzes.get(quizId);
      if (q.mode === 'TEAM') {
        const teams = await api.teams.list(quizId);
        const myTeam = teams.find((t) => t.members?.some((m) => m.userId === user?.id));
        if (myTeam) {
          navigate(`/quizzes/${quizId}/lobby`);
        } else {
          setSelectedTeamQuiz({
            id: q.id,
            title: q.title,
          });
        }
      } else {
        navigate(`/quizzes/${quizId}/lobby`);
      }
    } catch {
      navigate(`/quizzes/${quizId}/lobby`);
    }
  };

  const handleJoinQuiz = async (quiz: QuizSummary) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (quiz.mode === 'TEAM') {
      try {
        setCheckingTeamQuizId(quiz.id);
        const teams = await api.teams.list(quiz.id);
        const myTeam = teams.find((t) => t.members?.some((m) => m.userId === user?.id));
        if (myTeam) {
          navigate(`/quizzes/${quiz.id}/lobby`);
        } else {
          setSelectedTeamQuiz({
            id: quiz.id,
            title: quiz.title,
          });
        }
      } catch {
        navigate(`/quizzes/${quiz.id}/lobby`);
      } finally {
        setCheckingTeamQuizId(null);
      }
    } else {
      navigate(`/quizzes/${quiz.id}/lobby`);
    }
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
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-pink-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-indigo-200/80 shadow-xs text-indigo-700 text-xs font-extrabold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-indigo-600 -ml-3" />
            <span>Next-Gen Multiplayer Quiz Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Fast, Synchronized <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Live Quiz Arena
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Answer speed questions for maximum bonus score. Compete solo or form squads with teammates in real-time synchronized showdowns.
          </p>

          {/* Glowing Game PIN Input Portal */}
          <div className="pt-2 max-w-lg mx-auto">
            <div className="p-[2.5px] rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 shadow-2xl shadow-indigo-500/20">
              <form
                onSubmit={handleJoinPin}
                className="bg-white p-2 rounded-[14px] flex flex-col sm:flex-row items-center gap-2"
              >
                <div className="relative w-full flex-1">
                  <Key className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Game PIN (e.g. 6bc434)..."
                    value={gamePin}
                    onChange={(e) => setGamePin(e.target.value)}
                    className="w-full h-12 pl-11 pr-3 bg-transparent text-slate-900 font-mono font-black placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal text-sm sm:text-base outline-none tracking-wider uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-sm shadow-md transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
                >
                  <span>Join Game</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 max-w-2xl mx-auto text-left">
            <div className="glass-panel p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                <Zap className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Dynamic Speed Scoring</h4>
                <p className="text-[11px] text-slate-500 font-medium">Faster answers = more bonus pts</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Teams & Solo Squads</h4>
                <p className="text-[11px] text-slate-500 font-medium">Auto-join codes & live sync</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:translate-y-[-2px] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 shadow-inner">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Live Stage Podiums</h4>
                <p className="text-[11px] text-slate-500 font-medium">Leaderboards update live</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Quizzes List */}
      <section id="explore-quizzes" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
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
                  className="bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300/80 transition-all duration-300 group hover:-translate-y-1"
                >
                  {/* Top colorful accent stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accentGradient}`} />

                  <div className="space-y-3.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
                        {quiz.mode === 'TEAM' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold">
                            <Users className="w-3.5 h-3.5" />
                            Team Mode
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            Solo Battle
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono font-black text-slate-800 text-[11px] tracking-wider">
                          {toGamePin(quiz.id)}
                        </span>
                        {getStatusBadge(quiz.status)}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {quiz.description || 'Fast-paced real-time competition with live leaderboard.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.questionCount} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {quiz.participantCount} Players
                      </span>
                      {quiz.mode === 'TEAM' && (
                        <span className="text-indigo-600">{quiz.teamCount} Teams</span>
                      )}
                    </div>

                    {quiz.status === 'COMPLETED' ? (
                      <Link
                        to={`/quizzes/${quiz.id}/results`}
                        className="btn-secondary w-full text-xs justify-center !h-11 font-bold shadow-xs hover:border-amber-300"
                      >
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>View Podium & Standings</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleJoinQuiz(quiz)}
                        disabled={checkingTeamQuizId === quiz.id}
                        className={`w-full text-xs justify-center !h-11 transition-all flex items-center gap-2 rounded-xl font-extrabold cursor-pointer ${
                          quiz.mode === 'TEAM'
                            ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-101'
                            : 'btn-primary shadow-lg shadow-indigo-500/20 hover:scale-101'
                        }`}
                      >
                        {checkingTeamQuizId === quiz.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {quiz.mode === 'TEAM' && <Users className="w-4 h-4 text-indigo-200" />}
                            <span>{quiz.mode === 'TEAM' ? 'Join Team Quiz' : 'Join Game'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Team Prompt Modal when Joining Team Quiz */}
      {selectedTeamQuiz && (
        <TeamPromptModal
          isOpen={!!selectedTeamQuiz}
          quizId={selectedTeamQuiz.id}
          quizTitle={selectedTeamQuiz.title}
          onSuccess={() => {
            const targetId = selectedTeamQuiz.id;
            setSelectedTeamQuiz(null);
            navigate(`/quizzes/${targetId}/lobby`);
          }}
          onCancel={() => setSelectedTeamQuiz(null)}
          isBlocking={false}
        />
      )}
    </div>
  );
};
