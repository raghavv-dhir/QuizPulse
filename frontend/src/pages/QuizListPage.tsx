import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { QuizSummary } from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  User,
  Clock,
  ArrowRight,
  Shield,
  Search,
  BarChart2,
} from 'lucide-react';

export const QuizListPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isAdmin } = useAuth();

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

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'RUNNING':
      case 'QUESTION_ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16803C]">
            <span className="w-2 h-2 rounded-full bg-[#16803C]"></span>
            Live
          </span>
        );
      case 'LOBBY':
      case 'REGISTRATION_OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A16207]">
            <span className="w-2 h-2 rounded-full bg-[#A16207]"></span>
            Lobby Open
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B]">
            <span className="w-2 h-2 rounded-full bg-[#9E9E9E]"></span>
            Finished
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B]">
            <span className="w-2 h-2 rounded-full bg-[#9E9E9E]"></span>
            Draft
          </span>
        );
    }
  };

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    (q.description && q.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5E5E2]">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#1D4ED8]">
            Competitive Quiz Arena
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
            Speed-Based Showdowns
          </h1>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Live multi-team competitions calibrated with millisecond response timing.
            Faster correct answers earn progressively higher points.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && (
            <Link
              to="/admin"
              className="btn-secondary text-xs !h-9"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
            <input
              type="text"
              placeholder="Search competitions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ui-input w-full !h-9 !pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Competitions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ui-card p-6 h-48 animate-pulse bg-white"></div>
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="ui-card p-12 text-center space-y-2">
          <h3 className="text-sm font-semibold text-[#171717]">No Competitions Found</h3>
          <p className="text-xs text-[#6B6B6B]">There are no quizzes matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="ui-card p-6 flex flex-col justify-between space-y-6 hover:border-[#D4D4D0] transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6B6B6B] flex items-center gap-1.5">
                    {quiz.mode === 'TEAM' ? (
                      <>
                        <Users className="w-3.5 h-3.5" /> Team Mode
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" /> Individual
                      </>
                    )}
                  </span>
                  {getStatusIndicator(quiz.status)}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#171717] leading-snug">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-[#6B6B6B] line-clamp-2">
                    {quiz.description || 'Speed-based timed competition.'}
                  </p>
                </div>
              </div>

              {/* Stats Footer & Action */}
              <div className="space-y-4 pt-4 border-t border-[#E5E5E2]">
                <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                  <span>{quiz.questionCount} Questions</span>
                  <span>{quiz.participantCount} Participants</span>
                  {quiz.mode === 'TEAM' && <span>{quiz.teamCount} Teams</span>}
                </div>

                {quiz.status === 'COMPLETED' ? (
                  <Link
                    to={`/quizzes/${quiz.id}/results`}
                    className="btn-secondary w-full text-xs justify-center"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>View Standings</span>
                  </Link>
                ) : (
                  <Link
                    to={`/quizzes/${quiz.id}/lobby`}
                    className="btn-primary w-full text-xs justify-center"
                  >
                    <span>Enter Lobby</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
