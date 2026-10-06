-- V4__add_user_and_team_to_question_sessions.sql
-- Enables per-participant / per-team question sessions so late arrivals receive all questions

ALTER TABLE question_sessions ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE question_sessions ADD COLUMN IF NOT EXISTS team_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_sessions_user_quest ON question_sessions(quiz_id, user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_team_quest ON question_sessions(quiz_id, team_id, question_id);
