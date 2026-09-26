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
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#171717]/20 border-t-[#171717] rounded-full animate-spin" />
        <span className="text-xs font-medium text-[#6B6B6B]">Aggregating official results...</span>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 ui-card text-center space-y-4">
        <h3 className="text-sm font-bold text-[#171717]">Results Unavailable</h3>
        <p className="text-xs text-[#6B6B6B]">Could not retrieve competition results.</p>
        <Link to="/quizzes" className="btn-secondary text-xs">
          Return to Competitions
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
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#E5E5E2]">
        <div className="space-y-1">
          <Link
            to="/quizzes"
            className="text-xs font-semibold text-[#6B6B6B] hover:text-[#171717] flex items-center gap-1 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Competitions</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-[#171717] tracking-tight">
            {quizTitle}
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Official Final Competition Standings & Speed Breakdown
          </p>
        </div>

        <div className="flex items-center gap-3">
          {myRank && (
            <div className="px-4 py-2 rounded-md bg-white border border-[#E5E5E2] text-xs font-semibold">
              <span className="text-[#6B6B6B]">Your Position: </span>
              <span className="font-mono font-bold text-[#171717]">#{myRank}</span>
              <span className="text-[#6B6B6B]"> ({myTotalScore} pts)</span>
            </div>
          )}

          <button
            onClick={handleDownloadCsv}
            className="btn-secondary text-xs !h-9"
          >
            <Download className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards (Section 14: clean typography, no giant cartoon badges) */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((entry, idx) => (
            <div
              key={entry.id}
              className={`ui-card p-5 space-y-2 ${
                idx === 0 ? 'border-[#1D4ED8] bg-[#FBFBFF]' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
                <span className="font-mono font-bold text-[#171717]">
                  {idx === 0 ? 'WINNER · 01' : `RANK 0${idx + 1}`}
                </span>
                <span>{(entry.averageResponseTimeMs / 1000).toFixed(2)}s avg</span>
              </div>
              <h3 className="text-base font-bold text-[#171717] truncate">{entry.name}</h3>
              <div className="font-mono font-extrabold text-2xl text-[#171717] tabular-nums">
                {entry.totalScore.toLocaleString()} <span className="text-xs text-[#6B6B6B] font-normal">pts</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B]">
                {entry.correctAnswers} correct answers out of {entry.correctAnswers + entry.incorrectAnswers + entry.unansweredCount}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 border-b border-[#E5E5E2] pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'leaderboard'
                ? 'bg-[#171717] text-white'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Official Leaderboard ({leaderboard.length})
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'breakdown'
                ? 'bg-[#171717] text-white'
                : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Your Question Breakdown ({myQuestionResults.length})
          </button>
        </div>

        {/* Tab: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="ui-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E2] bg-[#F8F8F6] text-[#6B6B6B] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Participant / Team</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Correct</th>
                  <th className="py-3 px-4 text-center">Incorrect</th>
                  <th className="py-3 px-4 text-right">Avg Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {leaderboard.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#FBFBFA] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#6B6B6B]">
                      {String(entry.rank).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#171717]">
                      {entry.name}
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-[11px] text-[#6B6B6B] font-normal mt-0.5">
                          {entry.memberNames.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-[#171717] tabular-nums">
                      {entry.totalScore.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-[#16803C]">
                      {entry.correctAnswers}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-[#C62828]">
                      {entry.incorrectAnswers}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#6B6B6B] tabular-nums">
                      {(entry.averageResponseTimeMs / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Question Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="space-y-3">
            {myQuestionResults.map((q, idx) => (
              <div
                key={q.questionId}
                className="ui-card p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#6B6B6B]">
                    Question {idx + 1}
                  </span>
                  <span
                    className={`font-semibold ${
                      q.correct ? 'text-[#16803C]' : 'text-[#C62828]'
                    }`}
                  >
                    {q.correct ? `Correct (+${q.scoreAwarded} pts)` : 'Incorrect (0 pts)'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#171717]">{q.questionText}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded bg-[#F8F8F6] border border-[#E5E5E2]">
                    <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block">
                      Your Selection
                    </span>
                    <span className="font-medium text-[#171717] mt-0.5 block">
                      {q.selectedOptionText}
                    </span>
                    {q.submittedByName && (
                      <span className="text-[10px] text-[#6B6B6B] block mt-1">
                        By: {q.submittedByName}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded bg-[#F8F8F6] border border-[#E5E5E2]">
                    <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block">
                      Official Answer
                    </span>
                    <span className="font-medium text-[#16803C] mt-0.5 block">
                      {q.correctOptionText}
                    </span>
                    <span className="font-mono text-[10px] text-[#6B6B6B] block mt-1">
                      Time: {(q.responseTimeMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
