export type Role = 'ROLE_ADMIN' | 'ROLE_PARTICIPANT';

export type QuizMode = 'TEAM' | 'INDIVIDUAL';

export type QuizStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'LOBBY'
  | 'RUNNING'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_ENDED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ScoringStrategyType = 'LINEAR' | 'FIXED_BUCKET';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface UserAdminDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface UserStatsDto {
  totalUsers: number;
  totalAdmins: number;
  totalParticipants: number;
  totalQuizzes: number;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface QuestionOption {
  id: number;
  optionText: string;
  isCorrect?: boolean;
  displayOrder: number;
}

export interface PublicOption {
  id: number;
  optionText: string;
  displayOrder: number;
}

export interface Question {
  id: number;
  quizId: number;
  questionText: string;
  durationSeconds: number;
  maxScore: number;
  displayOrder: number;
  options: QuestionOption[];
}

export interface PublicQuestion {
  id: number;
  quizId: number;
  questionText: string;
  durationSeconds: number;
  maxScore: number;
  displayOrder: number;
  totalQuestions: number;
  options: PublicOption[];
}

export interface TeamMember {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  joinedAt: string;
}

export interface Team {
  id: number;
  quizId: number;
  name: string;
  code: string;
  createdAt: string;
  members: TeamMember[];
  memberCount: number;
}

export interface QuizSummary {
  id: number;
  title: string;
  description: string;
  mode: QuizMode;
  status: QuizStatus;
  questionCount: number;
  participantCount: number;
  teamCount: number;
  createdById: number;
  createdByName: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface QuizDetail {
  id: number;
  title: string;
  description: string;
  mode: QuizMode;
  status: QuizStatus;
  defaultQuestionDurationSeconds: number;
  maxScorePerQuestion: number;
  scoringStrategy: ScoringStrategyType;
  negativeMarking: boolean;
  negativePoints: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  immediateFeedback: boolean;
  fullscreenRequired: boolean;
  allowReconnection: boolean;
  currentQuestionIndex: number;
  createdById: number;
  createdByName: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  questions: Question[];
  teams: Team[];
  participantCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  isTeam: boolean;
  totalScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  totalResponseTimeMs: number;
  averageResponseTimeMs: number;
  lastSubmissionTimeMs?: number;
  memberNames?: string[];
}

export interface AnswerResult {
  questionId: number;
  selectedOptionId: number;
  responseTimeMs: number;
  scoreAwarded: number;
  isCorrect?: boolean | null;
  status: 'ACCEPTED' | 'REJECTED_TIMEOUT' | 'IGNORED_DUPLICATE';
  isOfficialTeamAnswer: boolean;
  submitterName: string;
  message: string;
}

export interface QuizState {
  quizId: number;
  title: string;
  status: QuizStatus;
  mode: QuizMode;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion?: PublicQuestion;
  serverQuestionStartTimeMs?: number;
  questionDurationMs?: number;
  fullscreenRequired?: boolean;
  serverCurrentTimeMs?: number;
  remainingTimeMs?: number;
  alreadyAnswered: boolean;
  myAnswer?: AnswerResult;
  myScore: number;
  myRank?: number;
  myTeam?: Team;
  leaderboard: LeaderboardEntry[];
}

export interface QuestionResult {
  questionId: number;
  questionText: string;
  displayOrder: number;
  selectedOptionText: string;
  correctOptionText: string;
  correct: boolean;
  responseTimeMs: number;
  scoreAwarded: number;
  submittedByName: string;
}

export interface QuizResults {
  quizId: number;
  quizTitle: string;
  leaderboard: LeaderboardEntry[];
  myQuestionResults: QuestionResult[];
  myRank?: number;
  myTotalScore: number;
}

export interface QuizEventMessage {
  eventType: string;
  quizId: number;
  timestamp: number;
  payload: any;
}
