-- ============================================
-- Employee Onboarding Security Application
-- PostgreSQL Database Schema
-- ============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS training_modules CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;

-- ============================================
-- USERS TABLE
-- Stores employee information
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_certified BOOLEAN DEFAULT FALSE,
    certification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups during authentication
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- TRAINING MODULES TABLE
-- Stores training content and requirements
-- ============================================
CREATE TABLE training_modules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_json JSONB NOT NULL,
    required_time_seconds INTEGER NOT NULL CHECK (required_time_seconds > 0),
    module_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for ordering modules
CREATE INDEX idx_modules_order ON training_modules(module_order);

-- ============================================
-- USER PROGRESS TABLE
-- Tracks individual user progress through modules
-- ============================================
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    watched_seconds INTEGER DEFAULT 0 CHECK (watched_seconds >= 0),
    focus_time_seconds INTEGER DEFAULT 0 CHECK (focus_time_seconds >= 0),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints with CASCADE delete
    CONSTRAINT fk_user_progress_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_progress_module
        FOREIGN KEY (module_id)
        REFERENCES training_modules(id)
        ON DELETE CASCADE,

    -- Ensure unique user-module combinations
    CONSTRAINT unique_user_module
        UNIQUE (user_id, module_id)
);

-- Indexes for faster queries
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_module ON user_progress(module_id);
CREATE INDEX idx_user_progress_completed ON user_progress(user_id, is_completed);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- Records all quiz attempts with pass/fail status
-- ============================================
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
    passed BOOLEAN NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    time_taken_seconds INTEGER,
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answers_json JSONB,

    -- Foreign key constraint
    CONSTRAINT fk_quiz_attempts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes for quiz statistics and history
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_date ON quiz_attempts(attempt_date);
CREATE INDEX idx_quiz_attempts_passed ON quiz_attempts(user_id, passed);

-- ============================================
-- QUIZ QUESTIONS TABLE (Supporting table)
-- Stores quiz questions for the final assessment
-- ============================================
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    module_id INTEGER,
    question_text TEXT NOT NULL,
    options_json JSONB NOT NULL,
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0),
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quiz_questions_module
        FOREIGN KEY (module_id)
        REFERENCES training_modules(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_quiz_questions_module ON quiz_questions(module_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for training_modules table
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON training_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_progress table
CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View: User training status overview
CREATE OR REPLACE VIEW user_training_status AS
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    u.hire_date,
    u.is_certified,
    COUNT(tm.id) AS total_modules,
    COUNT(CASE WHEN up.is_completed THEN 1 END) AS completed_modules,
    ROUND(
        (COUNT(CASE WHEN up.is_completed THEN 1 END)::DECIMAL /
         NULLIF(COUNT(tm.id), 0)) * 100, 2
    ) AS completion_percentage,
    COALESCE(SUM(up.watched_seconds), 0) AS total_watched_seconds
FROM users u
CROSS JOIN training_modules tm
LEFT JOIN user_progress up ON u.id = up.user_id AND tm.id = up.module_id
WHERE tm.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.hire_date, u.is_certified;

-- View: Quiz statistics per user
CREATE OR REPLACE VIEW user_quiz_stats AS
SELECT
    u.id AS user_id,
    u.name,
    COUNT(qa.id) AS total_attempts,
    MAX(qa.score) AS highest_score,
    AVG(qa.score) AS average_score,
    COUNT(CASE WHEN qa.passed THEN 1 END) AS passed_attempts,
    MAX(qa.attempt_date) AS last_attempt_date
FROM users u
LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
GROUP BY u.id, u.name;
