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
  LogOut,
} from 'lucide-react';

import { toGamePin, parsePinToId } from '../utils/gamePin';
import { TeamPromptModal } from '../components/TeamPromptModal';

export const ParticipantLobbyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quizId = parsePinToId(id) || Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Team state
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [showTeamPrompt, setShowTeamPrompt] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamActionLoading, setTeamActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [livePlayerCount, setLivePlayerCount] = useState<number>(1);
  const [leaving, setLeaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const quizData = await api.quizzes.get(quizId);
      setQuiz(quizData);
      setLivePlayerCount(quizData.participantCount || 1);

      if (quizData.status === 'RUNNING' || quizData.status === 'QUESTION_ACTIVE') {
        navigate(`/quizzes/${quizId}/live`);
        return;
      }

      if (quizData.mode === 'TEAM') {
        const teams = await api.teams.list(quizId);
        const myTeam = teams.find((t) => t.members?.some((m) => m.userId === user?.id));
        if (myTeam) {
          setUserTeam(myTeam);
          await api.quizzes.join(quizId);
        } else {
          // Participant joining a team-based quiz must enter team name first
          setShowTeamPrompt(true);
        }
      } else {
        await api.quizzes.join(quizId);
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
      } else if (event.eventType === 'PARTICIPANT_JOINED' || event.eventType === 'PARTICIPANT_LEFT') {
        if (event.payload?.participantCount !== undefined) {
          setLivePlayerCount(event.payload.participantCount);
        }
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

  const handleTeamSuccess = async (team: Team) => {
    setUserTeam(team);
    setShowTeamPrompt(false);
    try {
      await api.quizzes.join(quizId);
      const updatedQuiz = await api.quizzes.get(quizId);
      if (updatedQuiz?.participantCount) {
        setLivePlayerCount(updatedQuiz.participantCount);
      }
    } catch (e) {
      console.warn('Failed to register participant after team selection', e);
    }
  };

  const handlePromptCancel = () => {
    navigate('/quizzes');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setTeamActionLoading(true);
      setError(null);
      const team = await api.teams.create(quizId, teamName.trim());
      setUserTeam(team);
      setTeamName('');
      setShowTeamPrompt(false);
      await api.quizzes.join(quizId);
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
      setShowTeamPrompt(false);
      await api.quizzes.join(quizId);
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

  const gamePin = toGamePin(quizId);

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(gamePin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleLeaveLobby = async () => {
    if (!confirm('Leave this waiting room? You can re-join anytime before the quiz starts.')) return;
    try {
      setLeaving(true);
      await api.quizzes.leave(quizId);
    } catch (e) {
      console.warn('Failed to leave waiting room', e);
    } finally {
      navigate('/quizzes');
    }
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
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Top Game PIN Banner - High-Impact Esports Stage */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/30 shadow-2xl shadow-indigo-950/40">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300">
                Official Game PIN
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-6xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-md">
                {gamePin}
              </span>
              <button
                onClick={copyPinToClipboard}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-xs font-black text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                {copiedPin ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-indigo-200" />}
                <span>{copiedPin ? 'Copied!' : 'Copy PIN'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border border-white/15 shadow-xl sm:self-center">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 pr-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">Logged In As</span>
              <span className="text-xs sm:text-sm font-black text-white block truncate">
                {user?.fullName || user?.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Room Info */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/40 text-center space-y-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 font-extrabold text-xs border border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>You're in the Arena Lobby!</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            {quiz.description || 'Get ready for speed-based quiz rounds.'}
          </p>
        </div>

        {/* Specs Pill List */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 text-xs text-slate-600 font-semibold pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            {quiz.mode === 'TEAM' ? <Users className="w-3.5 h-3.5 text-indigo-600" /> : <User className="w-3.5 h-3.5 text-rose-500" />}
            {quiz.mode === 'TEAM' ? 'Team Mode' : 'Solo Battle'}
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {quiz.defaultQuestionDurationSeconds}s timer
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Max {quiz.maxScorePerQuestion} pts
          </span>
        </div>

        {/* Waiting Wave Animation or Team Prompt Alert */}
        {quiz.mode === 'TEAM' && !userTeam ? (
          <div className="p-6 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-amber-950">
                Team Name Required Before Starting
              </h4>
              <p className="text-xs text-amber-800/80 max-w-md mx-auto leading-relaxed">
                This is a team-based quiz! You must enter your team name or join with an invite code before the host starts the game.
              </p>
            </div>
            <button
              onClick={() => setShowTeamPrompt(true)}
              className="btn-primary text-xs !h-10 mx-auto shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter Team Name First</span>
            </button>
          </div>
        ) : (
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-indigo-100/60 border border-indigo-200/80 shadow-inner space-y-3">
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="w-3 h-3 rounded-full bg-indigo-600 animate-bounce shadow-md shadow-indigo-500/50" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-violet-600 animate-bounce shadow-md shadow-violet-500/50" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-600 animate-bounce shadow-md shadow-purple-500/50" style={{ animationDelay: '300ms' }} />
            </div>
            <h4 className="text-base font-black text-indigo-950">
              Waiting for Quiz Host to launch the game...
            </h4>
            <p className="text-xs sm:text-sm text-indigo-800/80 max-w-md mx-auto leading-relaxed">
              Keep this screen open! As soon as the host hits <strong>Start Quiz</strong>, your screen will automatically launch into Question 1 with live audio-visual countdown.
            </p>
          </div>
        )}

        {/* Live Lobby Status & Leave Button */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-800 font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-3.5" />
            <span>
              {livePlayerCount} {livePlayerCount === 1 ? 'Player' : 'Players'} connected in room
            </span>
          </div>

          <button
            onClick={handleLeaveLobby}
            disabled={leaving}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-rose-200/90 bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-extrabold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>{leaving ? 'Leaving Lobby...' : 'Leave Waiting Room'}</span>
          </button>
        </div>
      </div>

      {/* Team Coordination Section if Team Mode */}
      {quiz.mode === 'TEAM' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Team Roster & Squad
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Join squad or enter your code
            </span>
          </div>

          {userTeam ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-indigo-200/80 shadow-xl shadow-indigo-500/5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                    Your Active Squad
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>{userTeam.name}</span>
                    <span className="text-lg">🛡️</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 bg-indigo-50/80 px-3.5 py-2 rounded-2xl border border-indigo-200/80 shadow-inner">
                  <span className="text-xs text-indigo-700 font-bold">Invite Code:</span>
                  <span className="font-mono font-black text-base text-indigo-900 tracking-wider">
                    {userTeam.code}
                  </span>
                  <button
                    onClick={copyCodeToClipboard}
                    className="p-1.5 text-indigo-500 hover:text-indigo-800 transition rounded-lg hover:bg-white/60"
                    title="Copy Team Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  Teammates Ready ({userTeam.members?.length || 0} / 3)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {userTeam.members?.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between text-xs shadow-sm hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {m.fullName ? m.fullName[0].toUpperCase() : 'P'}
                        </div>
                        <span className="font-extrabold text-slate-900 truncate">{m.fullName}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Team Rule:</strong> The first teammate to answer locks in the speed bonus for the whole squad.
                </span>
              </div>
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

      {/* Mandatory Team Registration Prompt for Team-Based Quizzes */}
      {quiz.mode === 'TEAM' && (
        <TeamPromptModal
          isOpen={showTeamPrompt && !userTeam}
          quizId={quizId}
          quizTitle={quiz.title}
          onSuccess={handleTeamSuccess}
          onCancel={handlePromptCancel}
          isBlocking={true}
        />
      )}
    </div>
  );
};
