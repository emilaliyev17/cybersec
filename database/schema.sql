-- ============================================
-- Employee Onboarding Security Application
-- PostgreSQL Database Schema (Consolidated)
-- ============================================
-- This file represents the complete database structure.
-- Use this for fresh deployments. Migration files are kept for history.
-- Last updated: 2026-01-24
-- ============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_checklist_items CASCADE;
DROP TABLE IF EXISTS user_checklists CASCADE;
DROP TABLE IF EXISTS checklist_template_items CASCADE;
DROP TABLE IF EXISTS checklist_sections CASCADE;
DROP TABLE IF EXISTS checklist_templates CASCADE;
DROP TABLE IF EXISTS user_checklist_progress CASCADE;
DROP TABLE IF EXISTS onboarding_checklist_items CASCADE;
DROP TABLE IF EXISTS user_bios CASCADE;
DROP TABLE IF EXISTS track_modules CASCADE;
DROP TABLE IF EXISTS training_tracks CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS training_modules CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TRAINING TRACKS TABLE
-- Stores training track types (FULL/CONDENSED)
-- ============================================
CREATE TABLE training_tracks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    user_type VARCHAR(20) DEFAULT 'employee' CHECK (user_type IN ('employee', 'contractor', 'admin')),
    training_track_id INTEGER REFERENCES training_tracks(id),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_certified BOOLEAN DEFAULT FALSE,
    certification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups during authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_track ON users(training_track_id);

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
-- TRACK MODULES TABLE
-- Junction table for training tracks and modules
-- ============================================
CREATE TABLE track_modules (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_id, module_id)
);

CREATE INDEX idx_track_modules_track ON track_modules(track_id);
CREATE INDEX idx_track_modules_module ON track_modules(module_id);

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
-- QUIZ QUESTIONS TABLE
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
-- ONBOARDING CHECKLIST ITEMS TABLE (V1)
-- Stores checklist items per training track
-- ============================================
CREATE TABLE onboarding_checklist_items (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    item_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checklist_track ON onboarding_checklist_items(track_id);
CREATE INDEX idx_checklist_order ON onboarding_checklist_items(item_order);

-- ============================================
-- USER CHECKLIST PROGRESS TABLE (V1)
-- Tracks user progress on checklist items
-- ============================================
CREATE TABLE user_checklist_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checklist_item_id INTEGER NOT NULL REFERENCES onboarding_checklist_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, checklist_item_id)
);

CREATE INDEX idx_user_checklist_user ON user_checklist_progress(user_id);
CREATE INDEX idx_user_checklist_completed ON user_checklist_progress(user_id, is_completed);

-- ============================================
-- USER BIOS TABLE
-- Stores extended user profile information
-- ============================================
CREATE TABLE user_bios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio_text TEXT,
    job_title VARCHAR(255),
    department VARCHAR(255),
    location VARCHAR(255),
    skills TEXT[],
    linkedin_url VARCHAR(500),
    photo_url VARCHAR(500),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_bios_user ON user_bios(user_id);

-- ============================================
-- CHECKLIST TEMPLATES TABLE (V2)
-- Stores the 4 checklist types
-- ============================================
CREATE TABLE checklist_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    audience VARCHAR(100),
    trigger_event VARCHAR(100),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_interval VARCHAR(20), -- 'quarterly', 'semi-annual', 'annual'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHECKLIST SECTIONS TABLE (V2)
-- Sections within each template
-- ============================================
CREATE TABLE checklist_sections (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checklist_sections_template ON checklist_sections(template_id);
CREATE INDEX idx_checklist_sections_order ON checklist_sections(template_id, section_order);

-- ============================================
-- CHECKLIST TEMPLATE ITEMS TABLE (V2)
-- Items within each section
-- ============================================
CREATE TABLE checklist_template_items (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES checklist_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subsection VARCHAR(100),
    item_order INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    auto_complete_trigger VARCHAR(100), -- e.g., 'quiz_passed', 'training_completed'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_template_items_section ON checklist_template_items(section_id);
CREATE INDEX idx_template_items_order ON checklist_template_items(section_id, item_order);

-- ============================================
-- USER CHECKLISTS TABLE (V2)
-- Assigned checklists per user
-- ============================================
CREATE TABLE user_checklists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- For admin pre-onboarding: which new hire this is for
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at TIMESTAMP,
    period_label VARCHAR(50), -- 'Q1 2026', '2026 Annual', etc. for recurring checklists
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Unique constraint including target_user_id for admin checklists
    CONSTRAINT user_checklists_unique_assignment
        UNIQUE NULLS NOT DISTINCT (user_id, template_id, period_label, target_user_id)
);

CREATE INDEX idx_user_checklists_user ON user_checklists(user_id);
CREATE INDEX idx_user_checklists_template ON user_checklists(template_id);
CREATE INDEX idx_user_checklists_status ON user_checklists(status);
CREATE INDEX idx_user_checklists_due ON user_checklists(due_date);
CREATE INDEX idx_user_checklists_target ON user_checklists(target_user_id);

-- ============================================
-- USER CHECKLIST ITEMS TABLE (V2)
-- Progress on individual items
-- ============================================
CREATE TABLE user_checklist_items (
    id SERIAL PRIMARY KEY,
    user_checklist_id INTEGER NOT NULL REFERENCES user_checklists(id) ON DELETE CASCADE,
    template_item_id INTEGER NOT NULL REFERENCES checklist_template_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_checklist_id, template_item_id)
);

CREATE INDEX idx_user_checklist_items_checklist ON user_checklist_items(user_checklist_id);
CREATE INDEX idx_user_checklist_items_completed ON user_checklist_items(is_completed);

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

-- Function to update bio last_updated timestamp
CREATE OR REPLACE FUNCTION update_bio_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Trigger for user_checklist_progress table (V1)
CREATE TRIGGER update_user_checklist_updated_at
    BEFORE UPDATE ON user_checklist_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_bios table
CREATE TRIGGER update_user_bios_last_updated
    BEFORE UPDATE ON user_bios
    FOR EACH ROW
    EXECUTE FUNCTION update_bio_last_updated();

-- Trigger for checklist_templates table (V2)
CREATE TRIGGER update_checklist_templates_updated_at
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_checklists table (V2)
CREATE TRIGGER update_user_checklists_updated_at
    BEFORE UPDATE ON user_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_checklist_items table (V2)
CREATE TRIGGER update_user_checklist_items_updated_at
    BEFORE UPDATE ON user_checklist_items
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

-- View: User track training status (tracks-aware)
CREATE OR REPLACE VIEW user_track_training_status AS
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    u.hire_date,
    u.is_certified,
    tt.id AS track_id,
    tt.name AS track_name,
    tt.display_name AS track_display_name,
    COUNT(tm.module_id) AS total_track_modules,
    COUNT(CASE WHEN up.is_completed THEN 1 END) AS completed_track_modules,
    ROUND(
        (COUNT(CASE WHEN up.is_completed THEN 1 END)::DECIMAL /
         NULLIF(COUNT(tm.module_id), 0)) * 100, 2
    ) AS track_completion_percentage
FROM users u
LEFT JOIN training_tracks tt ON u.training_track_id = tt.id
LEFT JOIN track_modules tm ON tt.id = tm.track_id
LEFT JOIN user_progress up ON u.id = up.user_id AND tm.module_id = up.module_id
GROUP BY u.id, u.name, u.email, u.hire_date, u.is_certified, tt.id, tt.name, tt.display_name;

-- View: Checklist progress overview (V2)
CREATE OR REPLACE VIEW user_checklist_overview AS
SELECT
    uc.id AS user_checklist_id,
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.role AS user_role,
    ct.template_id,
    ct.name AS checklist_name,
    uc.status,
    uc.assigned_at,
    uc.due_date,
    uc.completed_at,
    uc.target_user_id,
    assigner.name AS assigned_by_name,
    COUNT(cti.id) AS total_items,
    COUNT(CASE WHEN uci.is_completed THEN 1 END) AS completed_items,
    ROUND(
        (COUNT(CASE WHEN uci.is_completed THEN 1 END)::DECIMAL /
         NULLIF(COUNT(cti.id), 0)) * 100, 2
    ) AS completion_percentage
FROM user_checklists uc
JOIN users u ON uc.user_id = u.id
JOIN checklist_templates ct ON uc.template_id = ct.id
LEFT JOIN users assigner ON uc.assigned_by = assigner.id
LEFT JOIN checklist_sections cs ON ct.id = cs.template_id AND cs.is_active = TRUE
LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
LEFT JOIN user_checklist_items uci ON uc.id = uci.user_checklist_id AND cti.id = uci.template_item_id
GROUP BY uc.id, u.id, u.name, u.email, u.role, ct.template_id, ct.name,
         uc.status, uc.assigned_at, uc.due_date, uc.completed_at, uc.target_user_id, assigner.name;
