import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { QuizDetail, Team, QuizEventMessage } from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import { useQuizWebSocket } from '../hooks/useQuizWebSocket';
import {
  Users,
  User,
  Clock,
  Zap,
  Copy,
  Check,
  Plus,
  KeyRound,
  AlertCircle,
  Share2,
  Sparkles,
} from 'lucide-react';

export const ParticipantLobbyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Team state
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamActionLoading, setTeamActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const quizData = await api.quizzes.get(quizId);
      setQuiz(quizData);

      await api.quizzes.join(quizId);

      if (quizData.status === 'RUNNING' || quizData.status === 'QUESTION_ACTIVE') {
        navigate(`/quizzes/${quizId}/live`);
        return;
      }

      if (quizData.mode === 'TEAM') {
        const teams = await api.teams.list(quizId);
        const myTeam = teams.find((t) => t.members?.some((m) => m.userId === user?.id));
        if (myTeam) {
          setUserTeam(myTeam);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enter lobby');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  useQuizWebSocket({
    quizId,
    teamId: userTeam?.id,
    onEvent: (event: QuizEventMessage) => {
      if (event.eventType === 'QUIZ_STARTED' || event.eventType === 'QUESTION_STARTED') {
        navigate(`/quizzes/${quizId}/live`);
      } else if (event.eventType === 'TEAM_CREATED' || event.eventType === 'TEAM_MEMBER_JOINED') {
        if (quiz?.mode === 'TEAM') {
          api.teams.list(quizId).then((teams) => {
            const myTeam = teams.find((t) => t.members?.some((m) => m.userId === user?.id));
            if (myTeam) setUserTeam(myTeam);
          });
        }
      }
    },
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setTeamActionLoading(true);
      setError(null);
      const team = await api.teams.create(quizId, teamName.trim());
      setUserTeam(team);
      setTeamName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleJoinTeamByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) return;

    try {
      setTeamActionLoading(true);
      setError(null);
      const team = await api.teams.joinByCode(quizId, teamCode.trim().toUpperCase());
      setUserTeam(team);
      setTeamCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to join team');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (userTeam?.code) {
      navigator.clipboard.writeText(userTeam.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(`${quizId}`);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Entering Game Room...
        </span>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Room Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'This competition does not exist.'}</p>
        <button onClick={() => navigate('/quizzes')} className="btn-primary text-xs">
          Explore Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Game PIN Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-200 block">
            Game Room PIN
          </span>
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-wider">
              #{quiz.id}
            </span>
            <button
              onClick={copyPinToClipboard}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPin ? 'Copied PIN!' : 'Copy PIN'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 sm:self-center">
          <div className="w-10 h-10 rounded-xl bg-white text-indigo-700 flex items-center justify-center font-black text-sm shadow-md">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <span className="text-[11px] text-indigo-200 block font-medium">Logged In As</span>
            <span className="text-sm font-extrabold text-white block">
              {user?.fullName || user?.username}
            </span>
          </div>
        </div>
      </div>

      {/* Main Room Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>You're in the Waiting Room!</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            {quiz.description || 'Get ready for speed-based quiz rounds.'}
          </p>
        </div>

        {/* Specs Pill List */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 font-semibold pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            {quiz.mode === 'TEAM' ? <Users className="w-4 h-4 text-indigo-600" /> : <User className="w-4 h-4 text-rose-500" />}
            {quiz.mode === 'TEAM' ? 'Team Mode (2–3 players)' : 'Solo Battle'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {quiz.defaultQuestionDurationSeconds}s per question
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Max {quiz.maxScorePerQuestion} pts
          </span>
        </div>

        {/* Waiting Wave Animation */}
        <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
          <div className="flex items-center justify-center gap-1.5 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <h4 className="text-sm font-extrabold text-indigo-950">
            Waiting for Quiz Host to launch the game...
          </h4>
          <p className="text-xs text-indigo-700/80">
            Keep this tab open! As soon as the host hits Start, your screen will transition automatically into Question 1.
          </p>
        </div>
      </div>

      {/* Team Coordination Section if Team Mode */}
      {quiz.mode === 'TEAM' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Team Selection
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Join teammates or form your own team
            </span>
          </div>

          {userTeam ? (
            <div className="bg-white rounded-3xl p-6 border border-indigo-200 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                    Your Active Team
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{userTeam.name}</h3>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold">Invite Code:</span>
                  <span className="font-mono font-black text-sm text-indigo-600 tracking-wider">
                    {userTeam.code}
                  </span>
                  <button
                    onClick={copyCodeToClipboard}
                    className="p-1 text-slate-400 hover:text-slate-800 transition"
                    title="Copy Team Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 block">
                  Teammates Connected ({userTeam.members?.length || 0} / 3)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {userTeam.members?.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-900 truncate">{m.fullName}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-medium">
                💡 <strong>Team Rule:</strong> The first teammate to answer locks in the score for the entire team.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Create Team Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Create a Team</h3>
                  <p className="text-xs text-slate-500">Pick a cool team name and invite friends</p>
                </div>
                <form onSubmit={handleCreateTeam} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code Wizards"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="ui-input w-full !h-11 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={teamActionLoading}
                    className="btn-primary w-full text-xs !h-11"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Team</span>
                  </button>
                </form>
              </div>

              {/* Join Team by Code Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Join a Teammate</h3>
                  <p className="text-xs text-slate-500">Enter your friend's 6-letter team code</p>
                </div>
                <form onSubmit={handleJoinTeamByCode} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALPHA1"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    className="ui-input w-full !h-11 text-xs font-mono uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={teamActionLoading}
                    className="btn-secondary w-full text-xs !h-11 justify-center"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Join with Code</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
