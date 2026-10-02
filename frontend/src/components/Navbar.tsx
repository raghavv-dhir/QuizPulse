import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Trophy, Shield, LogOut, User, Plus, Sparkles, Key, Menu, X, Compass, ArrowRight } from 'lucide-react';
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

  const isHome = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="flex items-center gap-2.5 group select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 group-hover:rotate-2 transition-all duration-200">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                  QuizPulse
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200/80 shadow-2xs">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Live</span>
                </span>
              </div>
            </Link>

            {/* Quick Explore Link (Desktop) */}
            <button
              onClick={handleExploreClick}
              className={`hidden lg:inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                isHome
                  ? 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Explore Quizzes</span>
            </button>
          </div>

          {/* Desktop Right Action Items */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Explore Quizzes on medium screens if hidden from left */}
            <button
              onClick={handleExploreClick}
              className="lg:hidden inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 transition-all duration-150 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Explore</span>
            </button>

            {/* Enter Game PIN Button */}
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="inline-flex items-center gap-2 h-[38px] px-3.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/90 shadow-2xs transition-all duration-150 hover:shadow-xs active:scale-[0.98] cursor-pointer group"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600 group-hover:rotate-12 transition-transform duration-150" />
              <span>Enter Game PIN</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-600 shadow-2xs">
                #
              </span>
            </button>

            {/* Host Dashboard (Admins) */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`inline-flex items-center gap-2 h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-xs cursor-pointer active:scale-[0.98] ${
                  isAdminPage
                    ? 'bg-gradient-to-r from-indigo-700 to-violet-700 text-white shadow-indigo-500/20 border border-indigo-500'
                    : 'bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white border border-slate-800 hover:shadow-md'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>Host Dashboard</span>
              </Link>
            )}

            {/* User Profile & Actions */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200/90">
                <div className="h-[38px] pl-1.5 pr-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/90 flex items-center gap-2 shadow-2xs transition-all duration-150">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-black shadow-xs select-none">
                    {user.fullName ? user.fullName[0].toUpperCase() : (user.username ? user.username[0].toUpperCase() : 'U')}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                    {user.fullName || user.username}
                  </span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-indigo-100 text-indigo-700 tracking-wider">
                      Host
                    </span>
                  )}
                  <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200/90">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center h-[38px] px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-150"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 h-[38px] px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 border border-indigo-500/40 transition-all duration-150 active:scale-[0.98]"
                >
                  <span>Sign Up Free</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Bar: Enter PIN + Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 shadow-2xs active:scale-[0.97]"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>PIN</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
            {user ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-violet-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : (user.username ? user.username[0].toUpperCase() : 'U')}
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {isAdmin ? 'Quiz Host / Admin' : 'Quiz Competitor'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <button
                onClick={handleExploreClick}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Explore Quizzes</span>
              </button>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 transition-colors"
                >
                  <Shield className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-inner border border-indigo-200/60">
                <Key className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Enter Game PIN</h3>
              <p className="text-xs text-slate-500">
                Ask your quiz host for the 6-character game code or ID to jump straight into the arena!
              </p>
            </div>

            <form onSubmit={handleJoinPin} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. 6BC434"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="ui-input w-full text-center text-xl font-extrabold font-mono tracking-widest uppercase !h-14 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="btn-secondary flex-1 !h-11 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 !h-11 text-xs shadow-md shadow-indigo-500/25"
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

