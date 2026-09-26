import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  QuizSummary,
  QuizMode,
  ScoringStrategyType,
  UserAdminDto,
  UserStatsDto,
  Role,
} from '../types/quiz';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Play,
  Trash2,
  X,
  FileText,
  Sparkles,
  Zap,
  Users,
  Clock,
  Shield,
  ArrowRight,
  UserPlus,
  Edit2,
  Key,
  Search,
  Mail,
  Check,
  User as UserIcon,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { toGamePin } from '../utils/gamePin';

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Active top-level tab: 'quizzes' or 'users'
  const [adminTab, setAdminTab] = useState<'quizzes' | 'users'>('quizzes');

  // Quizzes State
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exemplarLoading, setExemplarLoading] = useState(false);

  // Create Quiz Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<QuizMode>('TEAM');
  const [duration, setDuration] = useState(15);
  const [maxScore, setMaxScore] = useState(1000);
  const [scoringStrategy, setScoringStrategy] = useState<ScoringStrategyType>('LINEAR');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<UserAdminDto[]>([]);
  const [userStats, setUserStats] = useState<UserStatsDto | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ROLE_ADMIN' | 'ROLE_PARTICIPANT'>('ALL');

  // User Management Modals
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('ROLE_PARTICIPANT');
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<Role>('ROLE_PARTICIPANT');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);

  const loadQuizzes = async () => {
    try {
      setQuizzesLoading(true);
      const data = await api.quizzes.list();
      setQuizzes(data);
    } catch (e) {
      console.error('Failed to load quizzes', e);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const loadUsersAndStats = async () => {
    try {
      setUsersLoading(true);
      const [userList, stats] = await Promise.all([
        api.admin.users.list(),
        api.admin.users.getStats(),
      ]);
      setUsers(userList);
      setUserStats(stats);
    } catch (e) {
      console.error('Failed to load users and stats', e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    loadUsersAndStats();
  }, []);

  const handleCreateExemplarQuiz = async () => {
    try {
      setExemplarLoading(true);
      const created = await api.admin.createQuiz({
        title: 'Global Tech & Science Speed Showdown 2026',
        description: 'High-energy live quiz testing computer science, algorithms, networking, and modern tech.',
        mode: 'TEAM',
        defaultQuestionDurationSeconds: 15,
        maxScorePerQuestion: 1000,
        scoringStrategy: 'LINEAR',
        negativeMarking: false,
        negativePoints: 0,
        immediateFeedback: true,
        allowReconnection: true,
      });

      const sampleQuestions = [
        {
          questionText: 'What is the worst-case time complexity of quicksort when using deterministic last-element pivoting on already-sorted input?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 1,
          options: [
            { optionText: 'O(n log n)', isCorrect: false, displayOrder: 1 },
            { optionText: 'O(n²)', isCorrect: true, displayOrder: 2 },
            { optionText: 'O(n)', isCorrect: false, displayOrder: 3 },
            { optionText: 'O(log n)', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'Which HTTP status code is standardized for client-side API Rate Limiting violations?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 2,
          options: [
            { optionText: '403 Forbidden', isCorrect: false, displayOrder: 1 },
            { optionText: '429 Too Many Requests', isCorrect: true, displayOrder: 2 },
            { optionText: '503 Service Unavailable', isCorrect: false, displayOrder: 3 },
            { optionText: '408 Request Timeout', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'What consensus protocol is natively utilized by etcd and HashiCorp Consul to coordinate distributed cluster state?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 3,
          options: [
            { optionText: 'Paxos', isCorrect: false, displayOrder: 1 },
            { optionText: 'Raft', isCorrect: true, displayOrder: 2 },
            { optionText: 'Proof of Stake', isCorrect: false, displayOrder: 3 },
            { optionText: 'Two-Phase Commit', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'In PostgreSQL, which index type is specifically optimized for full-text search and array containment queries?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 4,
          options: [
            { optionText: 'B-Tree', isCorrect: false, displayOrder: 1 },
            { optionText: 'GIN (Generalized Inverted Index)', isCorrect: true, displayOrder: 2 },
            { optionText: 'Hash Index', isCorrect: false, displayOrder: 3 },
            { optionText: 'BRIN (Block Range Index)', isCorrect: false, displayOrder: 4 },
          ],
        },
        {
          questionText: 'During a standard TCP 3-way handshake, what packet does the server reply with upon receiving the client SYN?',
          durationSeconds: 15,
          maxScore: 1000,
          displayOrder: 5,
          options: [
            { optionText: 'SYN-ACK', isCorrect: true, displayOrder: 1 },
            { optionText: 'ACK only', isCorrect: false, displayOrder: 2 },
            { optionText: 'FIN-ACK', isCorrect: false, displayOrder: 3 },
            { optionText: 'RST packet', isCorrect: false, displayOrder: 4 },
          ],
        },
      ];

      for (const q of sampleQuestions) {
        await api.questions.add(created.id, q);
      }

      navigate(`/admin/quizzes/${created.id}/control`);
    } catch (err: any) {
      alert(err.message || 'Failed to create exemplar quiz');
    } finally {
      setExemplarLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreateLoading(true);
      setError(null);
      const created = await api.admin.createQuiz({
        title: title.trim(),
        description: description.trim(),
        mode,
        defaultQuestionDurationSeconds: duration,
        maxScorePerQuestion: maxScore,
        scoringStrategy,
        negativeMarking: false,
        negativePoints: 0,
        immediateFeedback: true,
        allowReconnection: true,
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      navigate(`/admin/quizzes/${created.id}/control`);
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm('Are you sure you want to delete this competition?')) return;
    try {
      await api.admin.deleteQuiz(id);
      loadQuizzes();
    } catch (e: any) {
      alert(e.message || 'Failed to delete quiz');
    }
  };

  // User CRUD Handlers
  const handleOpenEditUser = (u: UserAdminDto) => {
    setEditingUserId(u.id);
    setEditingUsername(u.username);
    setEditEmail(u.email);
    setEditFullName(u.fullName);
    setEditRole(u.role);
    setEditNewPassword('');
    setEditUserError(null);
    setIsEditUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim() || !newFullName.trim()) {
      setCreateUserError('All fields are required');
      return;
    }

    try {
      setCreateUserLoading(true);
      setCreateUserError(null);
      await api.admin.users.create({
        username: newUsername.trim(),
        email: newEmail.trim(),
        fullName: newFullName.trim(),
        password: newPassword,
        role: newRole,
      });
      setIsCreateUserModalOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      setNewRole('ROLE_PARTICIPANT');
      await loadUsersAndStats();
    } catch (err: any) {
      setCreateUserError(err.message || 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editEmail.trim() || !editFullName.trim()) {
      setEditUserError('Full Name and Email are required');
      return;
    }

    try {
      setEditUserLoading(true);
      setEditUserError(null);
      await api.admin.users.update(editingUserId, {
        email: editEmail.trim(),
        fullName: editFullName.trim(),
        role: editRole,
        newPassword: editNewPassword.trim() || undefined,
      });
      setIsEditUserModalOpen(false);
      await loadUsersAndStats();
    } catch (err: any) {
      setEditUserError(err.message || 'Failed to update user');
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUser = async (u: UserAdminDto) => {
    if (currentUser?.id === u.id) {
      alert('You cannot delete your own account while currently logged in.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${u.fullName}" (@${u.username})?`)) return;

    try {
      await api.admin.users.delete(u.id);
      await loadUsersAndStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Filter users by search and role
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    return true;
  });

  const totalParticipants = quizzes.reduce((acc, q) => acc + (q.participantCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Host Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage your competitions, participants, live control stages, and registered platform users.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {adminTab === 'quizzes' ? (
            <>
              <button
                onClick={handleCreateExemplarQuiz}
                disabled={exemplarLoading}
                className="btn-secondary text-xs shadow-sm !h-10"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{exemplarLoading ? 'Generating...' : '⚡ Quick Demo Quiz'}</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary text-xs shadow-md shadow-indigo-500/20 !h-10"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create a Quiz</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setCreateUserError(null);
                setIsCreateUserModalOpen(true);
              }}
              className="btn-primary text-xs shadow-md shadow-indigo-500/20 !h-10"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add New User</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row (Platform-Wide Statistics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Registered Users
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono block">
            {userStats?.totalUsers ?? users.length}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Admins / Hosts
            </span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-700 font-mono block">
            {userStats?.totalAdmins ?? users.filter((u) => u.role === 'ROLE_ADMIN').length}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Participants
            </span>
            <UserIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono block">
            {userStats?.totalParticipants ?? users.filter((u) => u.role === 'ROLE_PARTICIPANT').length}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Quizzes
            </span>
            <Zap className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono block">
            {quizzes.length}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setAdminTab('quizzes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            adminTab === 'quizzes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Competitions & Quizzes ({quizzes.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            adminTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: Quizzes List */}
      {adminTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Your Quizzes</h2>
            <span className="text-xs text-slate-500 font-semibold">{quizzes.length} Total</span>
          </div>

          {quizzesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="ui-card p-6 h-48 animate-pulse bg-white" />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-200 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Quizzes Created Yet</h3>
              <p className="text-xs text-slate-500">
                Generate a ready-to-run demo quiz with 1 click, or create a custom one from scratch.
              </p>
              <button
                onClick={handleCreateExemplarQuiz}
                className="btn-primary text-xs !h-10 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Quick Demo Quiz</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-black tracking-wide">
                        PIN: {toGamePin(quiz.id)}
                      </span>
                      <span className="badge bg-slate-100 text-slate-700">
                        {quiz.mode === 'TEAM' ? 'Team Mode' : 'Solo Mode'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 leading-snug">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {quiz.description || 'Live speed-based competition.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>{quiz.questionCount} Questions</span>
                      <span>{quiz.participantCount} Players</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/quizzes/${quiz.id}/control`}
                        className="btn-primary flex-1 text-xs justify-center !h-10"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Host Control Room</span>
                      </Link>

                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: User Management CRUD Panel */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Role Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="ui-input w-full !h-10 !pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Filter Role:</span>
              {(['ALL', 'ROLE_ADMIN', 'ROLE_PARTICIPANT'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'ALL' && 'All'}
                  {r === 'ROLE_ADMIN' && 'Admins'}
                  {r === 'ROLE_PARTICIPANT' && 'Players'}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table / Responsive Cards */}
          {usersLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <span className="text-xs font-bold text-slate-500">Loading registered users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Users Found</h3>
              <p className="text-xs text-slate-500">
                {userSearch ? 'No accounts matched your search terms.' : 'No users registered yet.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/70">
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Email Address</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isSelf = currentUser?.id === u.id;
                      const isAdminRole = u.role === 'ROLE_ADMIN';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                                  isAdminRole
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 block truncate">
                                    {u.fullName}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-200">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono text-slate-400 block truncate">
                                  @{u.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                            {u.email}
                          </td>

                          <td className="py-3.5 px-4">
                            {isAdminRole ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold">
                                <Crown className="w-3 h-3 text-indigo-600" />
                                Admin / Host
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                                <UserIcon className="w-3 h-3 text-slate-500" />
                                Participant
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                title="Edit user email, role, or reset password"
                              >
                                <Edit2 className="w-3 h-3 text-indigo-600" />
                                <span>Edit</span>
                              </button>

                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create New Quiz</h3>
                <p className="text-xs text-slate-500">Configure your live competition room</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Bowl Championship"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 rounds of high-speed science questions"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('TEAM')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        mode === 'TEAM'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('INDIVIDUAL')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        mode === 'INDIVIDUAL'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Solo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Question Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="ui-input w-full text-xs"
                  >
                    <option value={10}>10 Seconds (Ultra-Fast)</option>
                    <option value={15}>15 Seconds (Standard)</option>
                    <option value={20}>20 Seconds</option>
                    <option value={30}>30 Seconds (Relaxed)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary flex-1"
                >
                  {createLoading ? 'Creating...' : 'Create & Add Questions ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add New User</h3>
                <p className="text-xs text-slate-500">Register a new player or admin directly</p>
              </div>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createUserError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alexj"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Platform Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('ROLE_PARTICIPANT')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      newRole === 'ROLE_PARTICIPANT'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Participant / Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('ROLE_ADMIN')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      newRole === 'ROLE_ADMIN'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Admin / Host
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="btn-primary flex-1"
                >
                  {createUserLoading ? 'Creating...' : 'Create Account 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL (Email, Name, Role, Password Reset) */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">Edit User Details</h3>
                <p className="text-xs text-slate-500">Update account info or reset password for @{editingUsername}</p>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editUserError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editUserError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('ROLE_PARTICIPANT')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      editRole === 'ROLE_PARTICIPANT'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Participant / Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('ROLE_ADMIN')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      editRole === 'ROLE_ADMIN'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Admin / Host
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Password (Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  className="ui-input w-full text-xs bg-white"
                />
                <span className="text-[10px] text-amber-800/80 block">
                  Only enter text here if you want to assign a new password to this user.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="btn-primary flex-1"
                >
                  {editUserLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
