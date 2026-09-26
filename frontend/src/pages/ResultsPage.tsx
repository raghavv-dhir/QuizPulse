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
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const { user } = useAuth();

  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'breakdown'>('leaderboard');

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        const data = await api.quizzes.getResults(quizId);
        setResults(data);
      } catch (e) {
        console.error('Failed to load results', e);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [quizId]);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Celebratory Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Competition Concluded</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {quizTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Official Final Standings & Speed Breakdown
        </p>

        {myRank && (
          <div className="inline-flex items-center gap-3 bg-indigo-50 border border-indigo-200/80 px-4 py-2 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-indigo-700">Your Result:</span>
            <span className="text-sm font-black text-indigo-900 font-mono">
              Rank #{myRank}
            </span>
            <span className="text-xs font-extrabold text-indigo-600 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-100">
              {myTotalScore} pts
            </span>
          </div>
        )}
      </div>

      {/* Fun 1st, 2nd, 3rd Podium */}
      {top3.length > 0 && (
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end max-w-2xl mx-auto text-center">
            {/* 2nd Place */}
            {top3[1] ? (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2 order-1 h-56 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-2xl">🥈</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">2nd Place</span>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{top3[1].name}</h4>
                </div>
                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
                  <span className="font-mono font-black text-base text-slate-800 block">
                    {top3[1].totalScore.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">points</span>
                </div>
              </div>
            ) : <div className="order-1" />}

            {/* 1st Place (Winner) */}
            {top3[0] && (
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-xl shadow-amber-500/10 space-y-2 order-2 h-68 sm:h-72 flex flex-col justify-between relative scale-105">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                  👑 Winner
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-4xl">🥇</span>
                  <span className="text-[10px] font-black uppercase text-amber-700 block">Champion</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">{top3[0].name}</h3>
                </div>
                <div className="bg-amber-100/70 rounded-2xl p-3 border border-amber-200">
                  <span className="font-mono font-black text-xl text-amber-950 block">
                    {top3[0].totalScore.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">points</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] ? (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2 order-3 h-48 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-2xl">🥉</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">3rd Place</span>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{top3[2].name}</h4>
                </div>
                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
                  <span className="font-mono font-black text-base text-slate-800 block">
                    {top3[2].totalScore.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">points</span>
                </div>
              </div>
            ) : <div className="order-3" />}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
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
              Full Standings ({leaderboard.length})
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
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {entry.name}
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          {entry.memberNames.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-600">
                      {entry.totalScore.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">
                      {entry.correctAnswers}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {(entry.averageResponseTimeMs / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
