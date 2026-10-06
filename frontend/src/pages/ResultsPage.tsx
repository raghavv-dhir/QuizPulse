import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { QuizResults } from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import {
  Download,
  Check,
  X,
  ArrowLeft,
  Trophy,
  Sparkles,
  Zap,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { useQuizWebSocket } from '../hooks/useQuizWebSocket';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const { user } = useAuth();

  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'breakdown'>('leaderboard');
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());

  const fetchResults = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const data = await api.quizzes.getResults(quizId);
      setResults(data);
      setLastUpdatedTime(new Date());
    } catch (e) {
      console.error('Failed to load results', e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(true);
  }, [quizId]);

  // Dynamically update podium and leaderboard for late-arriving students in real time
  useQuizWebSocket({
    quizId,
    onEvent: (event) => {
      if (event.eventType === 'LEADERBOARD_UPDATED') {
        if (Array.isArray(event.payload)) {
          setResults((prev) => {
            if (!prev) return prev;
            const newLeaderboard = event.payload;
            const myIndex = newLeaderboard.findIndex((e: any) =>
              (user && e.id === user.id) ||
              (user && e.memberNames?.some((m: string) =>
                m.toLowerCase().includes(user.fullName?.toLowerCase() || user.username?.toLowerCase())
              ))
            );
            const updatedRank = myIndex >= 0 ? myIndex + 1 : prev.myRank;
            const myEntry = myIndex >= 0 ? newLeaderboard[myIndex] : null;
            const updatedScore = myEntry ? myEntry.totalScore : prev.myTotalScore;
            return {
              ...prev,
              leaderboard: newLeaderboard,
              myRank: updatedRank,
              myTotalScore: updatedScore,
            };
          });
          setLastUpdatedTime(new Date());
        } else {
          fetchResults(false);
        }
      } else if (event.eventType === 'QUESTION_ENDED' || event.eventType === 'QUIZ_ENDED') {
        fetchResults(false);
      }
    },
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Calculating Final Podium...
        </span>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-900">Results Unavailable</h3>
        <p className="text-xs text-slate-500">Could not retrieve competition results.</p>
        <Link to="/quizzes" className="btn-primary text-xs">
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const { leaderboard, myQuestionResults, myRank, myTotalScore, quizTitle } = results;
  const top3 = leaderboard.slice(0, 3);

  const handleDownloadCsv = () => {
    window.open(`/api/admin/quizzes/${quizId}/export`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Top Celebratory Header */}
      <div className="text-center space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-black border border-amber-200/90 shadow-sm animate-bounce">
            <Trophy className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>OFFICIAL VICTORY CEREMONY</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-2.5" />
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Standings Active</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          {quizTitle}
        </h1>
        <p className="text-xs sm:text-base text-slate-500 font-medium max-w-md mx-auto">
          Tournament concluded! Here are the champions and speed records.
        </p>

        {myRank && (
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-50 via-violet-50 to-indigo-50 border border-indigo-200/80 px-5 py-2.5 rounded-2xl shadow-sm text-xs sm:text-sm">
            <span className="font-bold text-indigo-700">Your Final Standing:</span>
            <span className="font-black text-indigo-950 font-mono text-sm sm:text-base">
              Rank #{myRank}
            </span>
            <span className="font-black text-indigo-600 bg-white px-2.5 py-1 rounded-xl border border-indigo-100 shadow-xs">
              {myTotalScore.toLocaleString()} pts
            </span>
          </div>
        )}
      </div>

      {/* Fun 1st, 2nd, 3rd Podium (Responsive) */}
      {top3.length > 0 && (
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-6 items-end max-w-2xl mx-auto text-center">
            {/* 2nd Place */}
            {top3[1] ? (
              <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100/80 rounded-3xl p-3 sm:p-5 border border-slate-300 shadow-lg space-y-2 order-1 h-48 sm:h-60 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="space-y-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center text-xl sm:text-2xl mx-auto shadow-inner">
                    🥈
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">2nd Place</span>
                  <h4 className="text-xs sm:text-base font-black text-slate-900 truncate">{top3[1].name}</h4>
                </div>
                <div className="bg-white/80 rounded-2xl p-2 sm:p-3 border border-slate-200 shadow-inner">
                  <span className="font-mono font-black text-xs sm:text-lg text-slate-800 block">
                    {top3[1].totalScore.toLocaleString()}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">pts</span>
                </div>
              </div>
            ) : <div className="order-1" />}

            {/* 1st Place (Winner) */}
            {top3[0] && (
              <div className="relative bg-gradient-to-b from-amber-100/90 via-amber-50 to-white rounded-3xl p-3.5 sm:p-6 border-2 border-amber-400 shadow-2xl shadow-amber-500/20 space-y-2 order-2 h-58 sm:h-76 flex flex-col justify-between scale-[1.04] sm:scale-110 z-10 transition-transform hover:-translate-y-1">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[10px] uppercase tracking-wider px-3 sm:px-4 py-1 rounded-full shadow-lg shrink-0 whitespace-nowrap flex items-center gap-1 border border-amber-300">
                  <span>👑</span>
                  <span>CHAMPION</span>
                </div>
                <div className="space-y-1 pt-2 sm:pt-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center text-2xl sm:text-4xl mx-auto shadow-inner border border-amber-300">
                    🥇
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">Grand Winner</span>
                  <h3 className="text-xs sm:text-lg font-black text-slate-900 truncate">{top3[0].name}</h3>
                </div>
                <div className="bg-amber-200/50 rounded-2xl p-2 sm:p-3.5 border border-amber-300/80 shadow-inner">
                  <span className="font-mono font-black text-sm sm:text-2xl text-amber-950 block">
                    {top3[0].totalScore.toLocaleString()}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-amber-800 font-black uppercase tracking-wider">pts</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] ? (
              <div className="bg-gradient-to-b from-orange-50/60 via-white to-amber-50/40 rounded-3xl p-3 sm:p-5 border border-amber-200 shadow-md space-y-2 order-3 h-42 sm:h-52 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="space-y-1">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg sm:text-xl mx-auto shadow-inner">
                    🥉
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">3rd Place</span>
                  <h4 className="text-xs sm:text-base font-black text-slate-900 truncate">{top3[2].name}</h4>
                </div>
                <div className="bg-white/80 rounded-2xl p-2 sm:p-2.5 border border-amber-100 shadow-inner">
                  <span className="font-mono font-black text-xs sm:text-base text-amber-950 block">
                    {top3[2].totalScore.toLocaleString()}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-amber-700 font-bold uppercase tracking-wider">pts</span>
                </div>
              </div>
            ) : <div className="order-3" />}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Leaderboard ({showAllEntries ? `All ${leaderboard.length}` : `Top ${Math.min(10, leaderboard.length)}`})
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'breakdown'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Your Answers ({myQuestionResults.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="btn-secondary text-xs !h-9"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/quizzes"
              className="btn-primary text-xs !h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Browse More Quizzes</span>
            </Link>
          </div>
        </div>

        {/* Tab: Leaderboard Table */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
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
                  {(showAllEntries ? leaderboard : leaderboard.slice(0, 10)).map((entry, idx) => {
                    const isMe =
                      (user && user.id === entry.id) ||
                      (user && entry.memberNames?.some((m) => m.toLowerCase().includes(user.fullName?.toLowerCase() || user.username?.toLowerCase())));

                    let rankDisplay = `#${idx + 1}`;
                    if (idx === 0) rankDisplay = '🥇 1';
                    else if (idx === 1) rankDisplay = '🥈 2';
                    else if (idx === 2) rankDisplay = '🥉 3';

                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          isMe ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-black text-slate-700 whitespace-nowrap">
                          {rankDisplay}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{entry.name}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase">
                                You ⭐
                              </span>
                            )}
                          </div>
                          {entry.memberNames && entry.memberNames.length > 0 && (
                            <div className="text-[11px] text-slate-400 font-normal">
                              {entry.memberNames.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-600 text-xs sm:text-sm">
                          {entry.totalScore.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">
                          {entry.correctAnswers}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {(entry.averageResponseTimeMs / 1000).toFixed(2)}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {leaderboard.length > 10 && (
              <div className="pt-3 text-center border-t border-slate-100">
                <button
                  onClick={() => setShowAllEntries(!showAllEntries)}
                  className="btn-secondary text-xs !h-9 mx-auto"
                >
                  {showAllEntries
                    ? 'Show Top 10 Only'
                    : `View Full Standings (${leaderboard.length} participants)`}
                </button>
              </div>
            )}

            {!showAllEntries && myRank && myRank > 10 && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-between text-xs font-bold text-indigo-950">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs">
                    #{myRank}
                  </span>
                  <span>Your Standing: {user?.fullName || user?.username} (You) ⭐</span>
                </div>
                <span className="font-mono text-indigo-700 font-black text-sm">
                  {myTotalScore.toLocaleString()} pts
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab: Personal Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="space-y-3">
            {myQuestionResults.map((r, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Question {r.displayOrder || idx + 1}</span>
                    {r.correct ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <X className="w-3 h-3" /> Wrong
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 font-semibold">{r.questionText}</p>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <span className="font-mono font-black text-indigo-600 text-sm block">
                    +{r.scoreAwarded} pts
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {(r.responseTimeMs / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
