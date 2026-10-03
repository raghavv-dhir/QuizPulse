-- V3__performance_indexes.sql: High-concurrency composite indexes for 100+ concurrent teams

-- Critical index for sub-millisecond duplicate-check / official answer lock
CREATE INDEX IF NOT EXISTS idx_answers_session_team_official 
    ON answers(question_session_id, team_id, is_official_team_answer);

-- High-speed query for quiz official team answers during leaderboard generation
CREATE INDEX IF NOT EXISTS idx_answers_quiz_official 
    ON answers(quiz_id, is_official_team_answer);

-- High-speed query for individual accepted answers
CREATE INDEX IF NOT EXISTS idx_answers_quiz_individual 
    ON answers(quiz_id, user_id, submission_status);

-- Composite index for finding the active question session without full table scan
CREATE INDEX IF NOT EXISTS idx_sessions_quiz_status_created 
    ON question_sessions(quiz_id, session_status, created_at DESC);

-- Index for participant lookup by quiz and user
CREATE INDEX IF NOT EXISTS idx_participants_quiz_user 
    ON quiz_participants(quiz_id, user_id);
