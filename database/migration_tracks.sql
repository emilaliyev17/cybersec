-- ============================================
-- Migration: Add Training Tracks Support
-- Version: 1.0.0
-- Date: 2026-01-17
-- Description: Adds two training tracks (FULL/CONDENSED) with admin management
-- ============================================

BEGIN;

-- ============================================
-- 1. CREATE TRAINING TRACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_tracks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tracks
INSERT INTO training_tracks (name, display_name, description) VALUES
('FULL', 'Full Onboarding', 'Complete training program for new employees with all modules and 20-step onboarding checklist'),
('CONDENSED', 'Condensed Refresher', 'Streamlined training for existing employees with essential modules and periodic refreshers')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. CREATE TRACK-MODULE JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS track_modules (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_track_modules_track ON track_modules(track_id);
CREATE INDEX IF NOT EXISTS idx_track_modules_module ON track_modules(module_id);

-- ============================================
-- 3. ADD TRAINING TRACK TO USERS
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'training_track_id'
    ) THEN
        ALTER TABLE users ADD COLUMN training_track_id INTEGER REFERENCES training_tracks(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_track ON users(training_track_id);

-- ============================================
-- 4. CREATE ONBOARDING CHECKLIST ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_checklist_items (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    item_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checklist_track ON onboarding_checklist_items(track_id);
CREATE INDEX IF NOT EXISTS idx_checklist_order ON onboarding_checklist_items(item_order);

-- ============================================
-- 5. CREATE USER CHECKLIST PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_checklist_progress (
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

CREATE INDEX IF NOT EXISTS idx_user_checklist_user ON user_checklist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_completed ON user_checklist_progress(user_id, is_completed);

-- ============================================
-- 6. CREATE USER BIOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_bios (
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

CREATE INDEX IF NOT EXISTS idx_user_bios_user ON user_bios(user_id);

-- ============================================
-- 7. POPULATE TRACK_MODULES FOR EXISTING MODULES
-- ============================================

-- FULL track gets ALL modules
INSERT INTO track_modules (track_id, module_id, is_required, display_order)
SELECT
    (SELECT id FROM training_tracks WHERE name = 'FULL'),
    tm.id,
    TRUE,
    tm.module_order
FROM training_modules tm
WHERE tm.is_active = TRUE
ON CONFLICT (track_id, module_id) DO NOTHING;

-- CONDENSED track gets: Quishing (2), BEC (4), Videos (5)
-- Excludes: Deepfakes (1), ClickFix (3)
INSERT INTO track_modules (track_id, module_id, is_required, display_order)
SELECT
    (SELECT id FROM training_tracks WHERE name = 'CONDENSED'),
    tm.id,
    TRUE,
    tm.module_order
FROM training_modules tm
WHERE tm.module_order IN (2, 4, 5) AND tm.is_active = TRUE
ON CONFLICT (track_id, module_id) DO NOTHING;

-- ============================================
-- 8. INSERT 20-STEP ONBOARDING CHECKLIST FOR FULL TRACK
-- ============================================
INSERT INTO onboarding_checklist_items (track_id, title, description, category, item_order) VALUES
-- HR & Legal (1-3, 13, 16)
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Sign employment contract', 'Review and sign your employment agreement', 'HR & Legal', 1),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Complete tax forms', 'Fill out W-4 and I-9 forms', 'HR & Legal', 2),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Set up direct deposit', 'Configure your payroll direct deposit', 'HR & Legal', 3),

-- Equipment (4, 19)
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Receive laptop and equipment', 'Pick up your work devices from IT', 'Equipment', 4),

-- IT Setup (5-6, 14-15)
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Set up email account', 'Configure your company email', 'IT Setup', 5),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Configure VPN access', 'Install and test VPN connectivity', 'IT Setup', 6),

-- Security (7-9)
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Enable multi-factor authentication', 'Set up MFA on all accounts', 'Security', 7),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Complete password manager setup', 'Install and configure password manager', 'Security', 8),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Review security policies', 'Read and acknowledge security policies', 'Security', 9),

-- Orientation (10-12, 17)
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Meet with your manager', 'Schedule and complete intro meeting', 'Orientation', 10),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Meet team members', 'Introduction calls with team', 'Orientation', 11),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Review org chart', 'Understand company structure', 'Orientation', 12),

-- HR & Legal continued
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Complete benefits enrollment', 'Select health, dental, and other benefits', 'HR & Legal', 13),

-- IT Setup continued
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Set up Slack/Teams', 'Join relevant channels and groups', 'IT Setup', 14),
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Access shared drives', 'Configure access to shared folders', 'IT Setup', 15),

-- HR & Legal continued
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Review company handbook', 'Read through employee handbook', 'HR & Legal', 16),

-- Orientation continued
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Schedule 30-day check-in', 'Book follow-up with manager', 'Orientation', 17),

-- Finance
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Complete expense policy training', 'Review expense submission procedures', 'Finance', 18),

-- Equipment continued
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Get building access badge', 'Obtain physical access credentials', 'Equipment', 19),

-- Security continued
((SELECT id FROM training_tracks WHERE name = 'FULL'), 'Complete all security training modules', 'Finish all assigned training modules', 'Security', 20)

ON CONFLICT DO NOTHING;

-- ============================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger for user_checklist_progress
DROP TRIGGER IF EXISTS update_user_checklist_updated_at ON user_checklist_progress;
CREATE TRIGGER update_user_checklist_updated_at
    BEFORE UPDATE ON user_checklist_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_bios
CREATE OR REPLACE FUNCTION update_bio_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_bios_last_updated ON user_bios;
CREATE TRIGGER update_user_bios_last_updated
    BEFORE UPDATE ON user_bios
    FOR EACH ROW
    EXECUTE FUNCTION update_bio_last_updated();

-- ============================================
-- 10. CREATE VIEW FOR TRACK TRAINING STATUS
-- ============================================
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

-- ============================================
-- 11. MIGRATE EXISTING USERS (OPTIONAL)
-- Uncomment to auto-assign tracks based on hire_date
-- ============================================

-- Assign FULL track to users hired in last 30 days
-- UPDATE users
-- SET training_track_id = (SELECT id FROM training_tracks WHERE name = 'FULL')
-- WHERE training_track_id IS NULL
--   AND hire_date >= CURRENT_DATE - INTERVAL '30 days';

-- Assign CONDENSED track to users hired more than 30 days ago
-- UPDATE users
-- SET training_track_id = (SELECT id FROM training_tracks WHERE name = 'CONDENSED')
-- WHERE training_track_id IS NULL
--   AND hire_date < CURRENT_DATE - INTERVAL '30 days';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================

-- Check tracks created
-- SELECT * FROM training_tracks;

-- Check track-module associations
-- SELECT tt.name as track, tm.title as module, trm.display_order
-- FROM track_modules trm
-- JOIN training_tracks tt ON trm.track_id = tt.id
-- JOIN training_modules tm ON trm.module_id = tm.id
-- ORDER BY tt.name, trm.display_order;

-- Check checklist items
-- SELECT category, COUNT(*) as items FROM onboarding_checklist_items GROUP BY category;
