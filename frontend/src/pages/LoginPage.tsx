import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Zap, Lock, Mail, Eye, EyeOff, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ usernameOrEmail: usernameOrEmail.trim(), password });
      navigate('/quizzes');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Side: Brand & Feature Highlights (Card UI) */}
        <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>QuizPulse Arena • Live Competitions</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Battle Your Knowledge in <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Real Time</span>
          </h1>

          <p className="text-sm text-slate-600 font-medium">
            Sign in to access synchronized multiplayer lobbies, compete with teams, and dominate the live podium.
          </p>

          {/* Quick Feature Cards */}
          <div className="hidden sm:grid grid-cols-1 gap-2.5 pt-2">
            <div className="ui-card p-3.5 flex items-center gap-3 bg-white/80 border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 fill-indigo-500" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Instant Speed Scoring</h4>
                <p className="text-[11px] text-slate-500">Every millisecond counts towards your podium rank</p>
              </div>
            </div>

            <div className="ui-card p-3.5 flex items-center gap-3 bg-white/80 border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Live Team Collaboration</h4>
                <p className="text-[11px] text-slate-500">Join teams with 6-character room codes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Main Authentication Form Card */}
        <div className="lg:col-span-7">
          <div className="ui-card p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-indigo-100/50 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Enter your credentials to continue</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="you@example.com or username"
                    className="ui-input w-full pl-10 text-xs font-medium"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ui-input w-full pl-10 pr-10 text-xs font-medium"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !h-12 text-sm shadow-md shadow-indigo-500/25 mt-2 transition-transform active:scale-[0.98]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by 256-bit encryption</span>
              </div>
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
