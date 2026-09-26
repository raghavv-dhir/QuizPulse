import {
  AuthResponse,
  LeaderboardEntry,
  PublicQuestion,
  Question,
  QuizDetail,
  QuizResults,
  QuizState,
  QuizSummary,
  Team,
  User,
  AnswerResult,
} from '../types/quiz';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';

const BASE_URL = API_BASE ? `${API_BASE}/api` : '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('quiz_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('quiz_token', token);
  } else {
    localStorage.removeItem('quiz_token');
  }
}

export function getCurrentUserStored(): User | null {
  const user = localStorage.getItem('quiz_user');
  return user ? JSON.parse(user) : null;
}

export function setCurrentUserStored(user: User | null): void {
  if (user) {
    localStorage.setItem('quiz_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('quiz_user');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized
    setAuthToken(null);
    setCurrentUserStored(null);
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  auth: {
    login: (credentials: { usernameOrEmail: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (details: { username: string; email: string; password: string; fullName: string; role?: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(details),
      }),
    me: () => request<User>('/auth/me'),
  },

  quizzes: {
    list: () => request<QuizSummary[]>('/quizzes'),
    get: (id: number) => request<QuizDetail>(`/quizzes/${id}`),
    join: (id: number) => request<string>(`/quizzes/${id}/join`, { method: 'POST' }),
    getState: (id: number) => request<QuizState>(`/quizzes/${id}/state`),
    submitAnswer: (quizId: number, questionId: number, selectedOptionId: number) =>
      request<AnswerResult>(`/quizzes/${quizId}/questions/${questionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionId, selectedOptionId }),
      }),
    getLeaderboard: (id: number) => request<LeaderboardEntry[]>(`/quizzes/${id}/leaderboard`),
    getResults: (id: number) => request<QuizResults>(`/quizzes/${id}/results`),
    reportCheating: (quizId: number, eventType: string, details?: string) =>
      request<string>(`/quizzes/${quizId}/audit/cheating`, {
        method: 'POST',
        body: JSON.stringify({ eventType, details }),
      }),
  },

  admin: {
    createQuiz: (payload: any) =>
      request<QuizDetail>('/admin/quizzes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateQuiz: (id: number, payload: any) =>
      request<QuizDetail>(`/admin/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    deleteQuiz: (id: number) =>
      request<string>(`/admin/quizzes/${id}`, {
        method: 'DELETE',
      }),
    openRegistration: (id: number) =>
      request<string>(`/admin/quizzes/${id}/open-registration`, { method: 'POST' }),
    openLobby: (id: number) =>
      request<string>(`/admin/quizzes/${id}/open-lobby`, { method: 'POST' }),
    startQuiz: (id: number) =>
      request<string>(`/admin/quizzes/${id}/start`, { method: 'POST' }),
    nextQuestion: (id: number) =>
      request<string>(`/admin/quizzes/${id}/next-question`, { method: 'POST' }),
    endQuestion: (id: number) =>
      request<string>(`/admin/quizzes/${id}/end-question`, { method: 'POST' }),
    pauseQuiz: (id: number) =>
      request<string>(`/admin/quizzes/${id}/pause`, { method: 'POST' }),
    resumeQuiz: (id: number) =>
      request<string>(`/admin/quizzes/${id}/resume`, { method: 'POST' }),
    finishQuiz: (id: number) =>
      request<string>(`/admin/quizzes/${id}/finish`, { method: 'POST' }),
    getAuditLogs: (id: number) =>
      request<any[]>(`/admin/quizzes/${id}/audit/logs`),
  },

  questions: {
    add: (quizId: number, payload: any) =>
      request<Question>(`/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: number, payload: any) =>
      request<Question>(`/admin/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: number) =>
      request<string>(`/admin/questions/${id}`, { method: 'DELETE' }),
  },

  teams: {
    list: (quizId: number) => request<Team[]>(`/quizzes/${quizId}/teams`),
    create: (quizId: number, name: string, code?: string) =>
      request<Team>(`/quizzes/${quizId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ name, code }),
      }),
    joinByCode: (quizId: number, code: string) =>
      request<Team>(`/quizzes/${quizId}/teams/join`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },
};
