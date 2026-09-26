-- V1__init_schema.sql

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    mode VARCHAR(20) NOT NULL, -- 'TEAM' or 'INDIVIDUAL'
    status VARCHAR(30) NOT NULL, -- 'DRAFT', 'REGISTRATION_OPEN', 'LOBBY', 'RUNNING', 'QUESTION_ACTIVE', 'QUESTION_ENDED', 'PAUSED', 'COMPLETED', 'CANCELLED'
    default_question_duration_seconds INT NOT NULL DEFAULT 15,
    max_score_per_question INT NOT NULL DEFAULT 1000,
    scoring_strategy VARCHAR(30) NOT NULL DEFAULT 'LINEAR', -- 'LINEAR', 'FIXED_BUCKET'
    negative_marking BOOLEAN NOT NULL DEFAULT FALSE,
    negative_points INT NOT NULL DEFAULT 0,
    randomize_questions BOOLEAN NOT NULL DEFAULT FALSE,
    randomize_options BOOLEAN NOT NULL DEFAULT FALSE,
    immediate_feedback BOOLEAN NOT NULL DEFAULT TRUE,
    fullscreen_required BOOLEAN NOT NULL DEFAULT FALSE,
    allow_reconnection BOOLEAN NOT NULL DEFAULT TRUE,
    current_question_index INT NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    CONSTRAINT fk_quizzes_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    duration_seconds INT NOT NULL DEFAULT 15,
    max_score INT NOT NULL DEFAULT 1000,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teams_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT uq_teams_quiz_name UNIQUE (quiz_id, name),
    CONSTRAINT uq_teams_quiz_code UNIQUE (quiz_id, code)
);

CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_team_member UNIQUE (team_id, user_id)
);

CREATE TABLE quiz_participants (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    team_id BIGINT,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participants_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_participants_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    CONSTRAINT uq_quiz_participant UNIQUE (quiz_id, user_id)
);

CREATE TABLE question_sessions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    session_status VARCHAR(20) NOT NULL, -- 'ACTIVE', 'ENDED'
    server_start_time_ms BIGINT NOT NULL,
    duration_ms BIGINT NOT NULL,
    server_end_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    question_session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    team_id BIGINT,
    selected_option_id BIGINT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    server_submission_time_ms BIGINT NOT NULL,
    response_time_ms BIGINT NOT NULL,
    score_awarded INT NOT NULL DEFAULT 0,
    submission_status VARCHAR(30) NOT NULL, -- 'ACCEPTED', 'REJECTED_TIMEOUT', 'IGNORED_DUPLICATE'
    is_official_team_answer BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_answers_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_session FOREIGN KEY (question_session_id) REFERENCES question_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    CONSTRAINT fk_answers_option FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
);

CREATE TABLE cheating_logs (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT'
    details TEXT,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cheating_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_cheating_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_questions_quiz_order ON questions(quiz_id, display_order);
CREATE INDEX idx_options_question ON question_options(question_id);
CREATE INDEX idx_participants_quiz ON quiz_participants(quiz_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_sessions_quiz_quest ON question_sessions(quiz_id, question_id);
CREATE INDEX idx_answers_quiz_quest ON answers(quiz_id, question_id);
CREATE INDEX idx_answers_team ON answers(team_id);
CREATE INDEX idx_answers_user ON answers(user_id);
