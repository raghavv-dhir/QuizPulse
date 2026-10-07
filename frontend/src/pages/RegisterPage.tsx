import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, User, Mail, Lock, Eye, EyeOff, Zap, ShieldCheck, Trophy, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role: 'ROLE_PARTICIPANT'
      });
      navigate('/quizzes');
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      if (msg.toLowerCase().includes('already taken') || (msg.toLowerCase().includes('username') && msg.toLowerCase().includes('taken'))) {
        setError('this username is already taken');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Side: Brand & Benefits Cards */}
        <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100/80 border border-violet-200/60 text-violet-700 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
            <span>Join the Competition • Instant Access</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Create Your Free <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Player Profile</span>
          </h1>

          <p className="text-sm text-slate-600 font-medium">
            Join live games with a PIN, team up with peers, track your performance analytics, and compete for top ranks.
          </p>

          {/* Quick Perks Cards */}
          <div className="hidden sm:grid grid-cols-1 gap-2.5 pt-2">
            <div className="ui-card p-3.5 flex items-center gap-3 bg-white/80 border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Zero Configuration</h4>
                <p className="text-[11px] text-slate-500">Jump right into open lobbies with single-click joining</p>
              </div>
            </div>

            <div className="ui-card p-3.5 flex items-center gap-3 bg-white/80 border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Live Podiums & Badges</h4>
                <p className="text-[11px] text-slate-500">Earn recognition on global and team leaderboards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Main Registration Form Card */}
        <div className="lg:col-span-7">
          <div className="ui-card p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-indigo-100/50 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Register</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Fill out your details to register immediately</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Zap className="w-5 h-5 fill-white" />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="ui-input w-full pl-10 text-xs font-medium"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="alex24"
                      className="ui-input w-full pl-10 text-xs font-medium"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="ui-input w-full pl-10 text-xs font-medium"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-[11px] text-slate-400 font-normal">(min 6 characters)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ui-input w-full pl-10 pr-10 text-xs font-medium"
                    autoComplete="new-password"
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
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted & Safe Account</span>
              </div>
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
