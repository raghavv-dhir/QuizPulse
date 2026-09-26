import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, User, Shield } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ROLE_PARTICIPANT' | 'ROLE_ADMIN'>('ROLE_PARTICIPANT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ username, email, password, fullName, role });
      navigate('/quizzes');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Create Account</h1>
          <p className="text-xs text-[#6B6B6B]">
            Join as a team participant or competition quiz master.
          </p>
        </div>

        <div className="ui-card p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECDCA] text-[#C62828] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Eleanor Vance"
                className="ui-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="eleanor24"
                className="ui-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor@example.com"
                className="ui-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ui-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_PARTICIPANT')}
                  className={`py-2 px-3 rounded-md text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    role === 'ROLE_PARTICIPANT'
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#4A4A4A] border-[#E5E5E2] hover:bg-[#F8F8F6]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Participant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ROLE_ADMIN')}
                  className={`py-2 px-3 rounded-md text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    role === 'ROLE_ADMIN'
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#4A4A4A] border-[#E5E5E2] hover:bg-[#F8F8F6]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Quiz Master</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !h-11 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6B6B6B]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1D4ED8] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
