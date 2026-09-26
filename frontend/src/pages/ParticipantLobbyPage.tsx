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
      } else if (event.eventType === 'REGISTRATION_OPENED' || event.eventType === 'LOBBY_OPENED') {
        loadData();
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

  const handleJoinTeam = async (e: React.FormEvent) => {
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#171717]/20 border-t-[#171717] rounded-full animate-spin" />
        <span className="text-xs font-medium text-[#6B6B6B]">Connecting to lobby...</span>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 ui-card text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#C62828] mx-auto" />
        <h3 className="text-sm font-bold text-[#171717]">Lobby Error</h3>
        <p className="text-xs text-[#6B6B6B]">{error || 'Quiz not found'}</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="btn-secondary text-xs"
        >
          Return to Competitions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header Info */}
      <div className="space-y-3 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16803C]">
          <span className="w-2 h-2 rounded-full bg-[#16803C]"></span>
          Lobby Active · Waiting for Host
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
          {quiz.title}
        </h1>
        <p className="text-sm text-[#6B6B6B] max-w-lg mx-auto">
          {quiz.description || 'Live speed-based competition.'}
        </p>

        {/* Specs Line */}
        <div className="flex items-center justify-center gap-6 text-xs text-[#6B6B6B] pt-2">
          <span className="flex items-center gap-1.5">
            {quiz.mode === 'TEAM' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {quiz.mode === 'TEAM' ? 'Team Mode (2–3 members)' : 'Individual'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {quiz.defaultQuestionDurationSeconds}s per question
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Max {quiz.maxScorePerQuestion} pts
          </span>
        </div>
      </div>

      {/* Waiting Indicator Card */}
      <div className="ui-card p-6 text-center space-y-2 bg-white">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
          Competition Status
        </div>
        <div className="text-sm font-semibold text-[#171717]">
          Round will launch immediately when the Quiz Master starts.
        </div>
        <p className="text-xs text-[#6B6B6B]">
          Keep this window open. Your screen will synchronize automatically.
        </p>
      </div>

      {/* Team Coordination Section */}
      {quiz.mode === 'TEAM' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B6B6B]">
            Team Assignment
          </h2>

          {userTeam ? (
            <div className="ui-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E2]">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
                    Assigned Team
                  </span>
                  <h3 className="text-lg font-bold text-[#171717]">{userTeam.name}</h3>
                </div>

                <div className="flex items-center gap-2 bg-[#F8F8F6] px-3 py-1.5 rounded-md border border-[#E5E5E2]">
                  <span className="text-xs text-[#6B6B6B]">Code:</span>
                  <span className="font-mono font-bold text-xs text-[#171717] tracking-wider">
                    {userTeam.code}
                  </span>
                  <button
                    onClick={copyCodeToClipboard}
                    className="p-1 text-[#6B6B6B] hover:text-[#171717] transition"
                    title="Copy Team Code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#16803C]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#6B6B6B] block">
                  Members ({userTeam.members?.length || 0} / 3)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {userTeam.members?.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-md bg-[#F8F8F6] border border-[#E5E5E2] flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-[#171717] truncate">{m.fullName}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#16803C] font-medium ml-2 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16803C]"></span>
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-[#6B6B6B] pt-2">
                <strong>First-answer policy:</strong> The first teammate to submit a valid answer determines the team's answer and score.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Create Team */}
              <div className="ui-card p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Create Team
                </h3>
                <form onSubmit={handleCreateTeam} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Team Name (e.g. Apex)"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="ui-input w-full !h-9 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={teamActionLoading}
                    className="btn-primary w-full text-xs !h-9"
                  >
                    <span>Create Team</span>
                  </button>
                </form>
              </div>

              {/* Join Team with Code */}
              <div className="ui-card p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Join with Code
                </h3>
                <form onSubmit={handleJoinTeam} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="6-character code"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    className="ui-input w-full !h-9 text-xs uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={teamActionLoading}
                    className="btn-secondary w-full text-xs !h-9"
                  >
                    <span>Join Team</span>
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
