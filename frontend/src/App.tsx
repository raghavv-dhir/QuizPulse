import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { QuizListPage } from './pages/QuizListPage';
import { ParticipantLobbyPage } from './pages/ParticipantLobbyPage';
import { LiveQuizRoomPage } from './pages/LiveQuizRoomPage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { QuizControlRoomPage } from './pages/QuizControlRoomPage';

const queryClient = new QueryClient();

// Protected Route for Authenticated Users
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

// Protected Route for Admins
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }
  return user && isAdmin ? children : <Navigate to="/quizzes" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public / Auth */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Quizzes & Competitions */}
                <Route path="/" element={<QuizListPage />} />
                <Route path="/quizzes" element={<QuizListPage />} />

                <Route
                  path="/quizzes/:id/lobby"
                  element={
                    <PrivateRoute>
                      <ParticipantLobbyPage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/quizzes/:id/live"
                  element={
                    <PrivateRoute>
                      <LiveQuizRoomPage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/quizzes/:id/results"
                  element={
                    <PrivateRoute>
                      <ResultsPage />
                    </PrivateRoute>
                  }
                />

                {/* Admin Quiz Master Management */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/quizzes/:id/control"
                  element={
                    <AdminRoute>
                      <QuizControlRoomPage />
                    </AdminRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
