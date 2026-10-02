import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  Plus,
  KeyRound,
  AlertCircle,
  X,
  Shuffle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import { Team } from '../types/quiz';

interface TeamPromptModalProps {
  isOpen: boolean;
  quizId: number;
  quizTitle: string;
  onSuccess: (team: Team) => void;
  onCancel: () => void;
  isBlocking?: boolean;
}

const NAME_SUGGESTIONS = [
  '⚡ Velocity Thinkers',
  '🚀 Cyber Ninjas',
  '🧠 Mind Benders',
  '🔥 Quantum Sparks',
  '🎯 Alpha Squad',
  '👑 Brain Trust',
  '⚡ Blitz Strikers',
  '🛡️ Code Guardians',
];

export const TeamPromptModal: React.FC<TeamPromptModalProps> = ({
  isOpen,
  quizId,
  quizTitle,
  onSuccess,
  onCancel,
  isBlocking = true,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRandomizeName = () => {
    const randomIndex = Math.floor(Math.random() * NAME_SUGGESTIONS.length);
    setTeamName(NAME_SUGGESTIONS[randomIndex].replace(/^[^\s]+\s/, ''));
    setError(null);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) {
      setError('Please enter a team name');
      return;
    }
    if (trimmed.length < 2) {
      setError('Team name must be at least 2 characters long');
      return;
    }
    if (trimmed.length > 40) {
      setError('Team name cannot exceed 40 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const team = await api.teams.create(quizId, trimmed);
      onSuccess(team);
    } catch (err: any) {
      setError(err.message || 'Failed to create team. The name might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a valid 6-character team invite code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const team = await api.teams.joinByCode(quizId, trimmed);
      onSuccess(team);
    } catch (err: any) {
      setError(err.message || 'Failed to join team. Please check the invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white relative">
          {!isBlocking && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/40 text-indigo-100 text-[10px] font-extrabold uppercase tracking-widest border border-white/10 mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Team Quiz Registration
              </div>
              <h2 className="text-xl font-black text-white tracking-tight leading-snug">
                Enter Team Name First
              </h2>
            </div>
          </div>

          <p className="mt-3 text-xs text-indigo-100/90 leading-relaxed">
            <span className="font-semibold text-white">"{quizTitle}"</span> is a team-based competition. To enter the room, you must either name a new team or enter your teammate's code.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setError(null);
            }}
            className={`pb-3 px-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Team</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setError(null);
            }}
            className={`pb-3 px-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'join'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Join Existing Squad</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Team Name <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Inspire Me</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={40}
                    placeholder="e.g. Cyber Strikers"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="ui-input w-full !h-12 text-sm pl-4 pr-12 font-semibold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    {teamName.length}/40
                  </div>
                </div>
              </div>

              {/* Quick suggestion tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Quick Name Ideas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {NAME_SUGGESTIONS.slice(0, 4).map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setTeamName(tag.replace(/^[^\s]+\s/, ''));
                        setError(null);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-semibold transition border border-slate-200/70"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900/80 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Solo & Squad Eligible:</strong> You can compete solo as a 1-member squad, or share your <strong>6-character invite code</strong> with up to 2 teammates anytime before the quiz launches.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-secondary text-xs !h-11 px-4 text-slate-600"
                >
                  Cancel / Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !teamName.trim()}
                  className="btn-primary flex-1 text-xs !h-11 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Squad...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span>Create Team & Enter Lobby</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Team Invite Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="e.g. ALPHA1"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  className="ui-input w-full !h-12 text-center text-base font-mono font-black tracking-widest uppercase text-indigo-600 placeholder:text-slate-300"
                />
                <p className="text-[11px] text-slate-400">
                  Ask your teammate or captain for their 6-character squad invite code.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-secondary text-xs !h-11 px-4 text-slate-600"
                >
                  Cancel / Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !teamCode.trim()}
                  className="btn-primary flex-1 text-xs !h-11 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Joining Squad...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span>Join Squad & Enter Lobby</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
