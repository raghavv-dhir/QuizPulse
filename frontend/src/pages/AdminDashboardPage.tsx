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
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Create Quiz Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<QuizMode>('TEAM');
  const [duration, setDuration] = useState(15);
  const [maxScore, setMaxScore] = useState(1000);
  const [scoringStrategy, setScoringStrategy] = useState<ScoringStrategyType>('LINEAR');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativePoints, setNegativePoints] = useState(0);
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
        negativeMarking,
        negativePoints,
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
  const totalTeams = quizzes.reduce((acc, q) => acc + q.teamCount, 0);
  const activeQuiz = quizzes.find((q) => q.status === 'RUNNING' || q.status === 'QUESTION_ACTIVE');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Operations Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#E5E5E2]">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D4ED8] block">
            Operations Console
          </span>
          <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight">
            Competition Management
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Configure speed engines, orchestrate live question delivery, and monitor real-time rankings.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Competition</span>
        </button>
      </div>

      {/* Metric Layout (Section 10) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
            Total Quizzes
          </span>
          <span className="text-3xl font-extrabold text-[#171717] font-mono tabular-nums">
            {quizzes.length}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
            Total Participants
          </span>
          <span className="text-3xl font-extrabold text-[#171717] font-mono tabular-nums">
            {totalParticipants}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
            Registered Teams
          </span>
          <span className="text-3xl font-extrabold text-[#171717] font-mono tabular-nums">
            {totalTeams}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
            Active Session
          </span>
          <span className="text-sm font-bold text-[#171717] truncate block mt-2">
            {activeQuiz ? activeQuiz.title : 'None in progress'}
          </span>
        </div>
      </div>

      {/* Competitions Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#171717]">All Competitions</h2>

        {loading ? (
          <div className="ui-card p-12 text-center text-xs text-[#6B6B6B]">Loading console data...</div>
        ) : quizzes.length === 0 ? (
          <div className="ui-card p-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#9E9E9E] mx-auto" />
            <h3 className="text-sm font-semibold text-[#171717]">No Competitions Configured</h3>
            <p className="text-xs text-[#6B6B6B]">Create your first competition to launch a live room.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-xs"
            >
              Create Competition
            </button>
          </div>
        ) : (
          <div className="ui-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E2] bg-[#F8F8F6] text-[#6B6B6B] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Teams</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-[#FBFBFA] transition">
                    <td className="py-3.5 px-4 font-semibold text-[#171717]">
                      {quiz.title}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B6B]">
                      {quiz.mode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[11px] text-[#171717]">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            quiz.status === 'RUNNING' || quiz.status === 'QUESTION_ACTIVE'
                              ? 'bg-[#16803C]'
                              : quiz.status === 'LOBBY'
                              ? 'bg-[#A16207]'
                              : 'bg-[#9E9E9E]'
                          }`}
                        />
                        {quiz.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#171717]">
                      {quiz.questionCount}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#171717]">
                      {quiz.mode === 'TEAM' ? quiz.teamCount : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/quizzes/${quiz.id}/control`}
                          className="btn-primary text-xs !h-8 !px-3"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Console</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#C62828] transition rounded"
                          title="Delete Competition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clean Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="ui-card p-6 sm:p-7 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-modal">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
              <h3 className="text-base font-bold text-[#171717]">Configure Competition</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#6B6B6B] hover:text-[#171717] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECDCA] text-[#C62828] text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateQuiz} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Competition Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Inter-College Quiz 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="ui-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Competition scope, eligibility, and rules..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="ui-input w-full !h-20 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as QuizMode)}
                    className="ui-input w-full"
                  >
                    <option value="TEAM">Team Mode (Up to 100 Teams)</option>
                    <option value="INDIVIDUAL">Individual Mode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Scoring Strategy
                  </label>
                  <select
                    value={scoringStrategy}
                    onChange={(e) => setScoringStrategy(e.target.value as ScoringStrategyType)}
                    className="ui-input w-full"
                  >
                    <option value="LINEAR">Linear Speed Scoring</option>
                    <option value="FIXED_BUCKET">Fixed Bucket Scoring</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Question Duration (sec)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="ui-input w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Max Score / Question
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    step={100}
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="ui-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="negMark"
                  checked={negativeMarking}
                  onChange={(e) => setNegativeMarking(e.target.checked)}
                  className="rounded border-[#E5E5E2] text-[#1D4ED8] focus:ring-0"
                />
                <label htmlFor="negMark" className="text-xs font-medium text-[#171717]">
                  Enable Negative Marking
                </label>
              </div>

              {negativeMarking && (
                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Negative Penalty
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={negativePoints}
                    onChange={(e) => setNegativePoints(Number(e.target.value))}
                    className="ui-input w-full font-mono"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#E5E5E2] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary text-xs"
                >
                  {createLoading ? 'Saving...' : 'Create Competition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
