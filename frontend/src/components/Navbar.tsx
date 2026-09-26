import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Trophy, Shield, LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-[#E5E5E2] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#171717] flex items-center justify-center text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight text-[#171717]">
              QuizPulse
            </span>
            <span className="text-[11px] font-semibold text-[#6B6B6B] tracking-wider uppercase">
              Arena
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/quizzes"
              className="text-xs font-semibold text-[#4A4A4A] hover:text-[#171717] px-3 py-1.5 rounded-md hover:bg-[#F4F4F1] transition"
            >
              Competitions
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 rounded-md hover:bg-[#DBEAFE] transition flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}

            <div className="h-4 w-[1px] bg-[#E5E5E2] hidden sm:block"></div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-7 h-7 rounded-md bg-[#F4F4F1] border border-[#E5E5E2] flex items-center justify-center text-xs font-bold text-[#171717]">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <span className="font-semibold text-[#171717] block leading-none">
                  {user.fullName}
                </span>
                <span className="text-[10px] text-[#6B6B6B] font-mono mt-0.5 block">
                  {isAdmin ? 'Quiz Master' : `@${user.username}`}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md text-[#6B6B6B] hover:text-[#C62828] hover:bg-[#FEF2F2] transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#4A4A4A] hover:text-[#171717] px-3 py-1.5 rounded-md transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary text-xs !h-8 !px-3.5"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
