import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Trophy, Shield, LogOut, User, Plus, Sparkles, Key, Menu, X } from 'lucide-react';
import { parsePinToId } from '../utils/gamePin';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pinInput, setPinInput] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    const quizId = parsePinToId(pinInput);
    if (!quizId) return;
    setIsPinModalOpen(false);
    setIsMobileMenuOpen(false);
    setPinInput('');
    navigate(`/quizzes/${quizId}/lobby`);
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const el = document.getElementById('explore-quizzes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#explore-quizzes');
    }
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-hover:rotate-3 transition-transform">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                QuizPulse
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200/70 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 -ml-2.5" />
                <span>Live</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200/80 shadow-xs transition hover:scale-102 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enter Game PIN</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200/60 text-indigo-800 font-mono">#</span>
            </button>

            <a
              href="#explore-quizzes"
              onClick={handleExploreClick}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100/80 transition cursor-pointer"
            >
              Explore Quizzes
            </a>

            {isAdmin && (
              <Link
                to="/admin"
                className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-xl shadow-md shadow-slate-900/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Host Dashboard</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-white border border-slate-200/90 shadow-xs py-1 px-3 rounded-xl">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">
                    {user.fullName || user.username}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-1">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs !h-9 !px-4 shadow-md shadow-indigo-500/20"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Bar: Enter PIN + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80"
            >
              <Key className="w-3.5 h-3.5" />
              <span>PIN</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {user && (
              <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {isAdmin ? 'Quiz Host / Admin' : 'Player'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            )}

            <div className="space-y-1">
              <a
                href="#explore-quizzes"
                onClick={handleExploreClick}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Explore Quizzes</span>
              </a>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200/60 transition"
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Host Dashboard</span>
                </Link>
              )}
            </div>

            {!user && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-secondary !h-10 text-xs justify-center font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary !h-10 text-xs justify-center font-bold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Enter Game PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Enter Game PIN</h3>
              <p className="text-xs text-slate-500">
                Ask your quiz host for the game code or ID to jump straight into the competition!
              </p>
            </div>

            <form onSubmit={handleJoinPin} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. 6bc434 or 7e567f"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="ui-input w-full text-center text-xl font-extrabold font-mono tracking-widest uppercase !h-14 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Join Game 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
