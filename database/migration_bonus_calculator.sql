-- ============================================
-- Migration: Bonus Calculator
-- Version: 1.0.0
-- Date: 2026-03-09
-- Description: Adds bonus pool calculator tables and seed employees
-- ============================================

BEGIN;

-- ============================================
-- 0. INSERT MISSING EMPLOYEES INTO users + user_bios
-- (ON CONFLICT DO NOTHING for idempotency)
-- ============================================
INSERT INTO users (name, email, password_hash, role, user_type, hire_date) VALUES
('Derek Cheng',       'derek.cheng@strategybrix.com',       '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2022-10-31'),
('Shreeya Laad',      'shreeya.laad@strategybrix.com',      '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2023-10-23'),
('Edward Hale',       'edward.hale@strategybrix.com',       '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2024-01-15'),
('Colleen Liu',       'colleen.liu@strategybrix.com',       '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2024-02-12'),
('Ethan McComb',      'ethan.mccomb@strategybrix.com',      '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2024-04-22'),
('Vishal Singh',      'vishal.singh@strategybrix.com',       '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2024-05-06'),
('Oumayma El Adaou',  'oumayma.eladaou@strategybrix.com',   '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2024-09-10'),
('Shruti Bansal',     'shruti.bansal@strategybrix.com',      '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2024-09-23'),
('Anuj Shah',         'anuj.shah@strategybrix.com',          '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2024-11-11'),
('Ravneet Padda',     'ravneet.padda@strategybrix.com',      '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2025-01-02'),
('Jeff West',         'jeff.west@strategybrix.com',          '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2025-01-20'),
('Ashima Ghai',       'ashima.ghai@strategybrix.com',        '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2025-02-18'),
('Ghazal Alghannam',  'ghazal.alghannam@strategybrix.com',   '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2025-03-24'),
('Adam Midden',       'adam.midden@strategybrix.com',        '$2b$10$placeholder.hash.bonus.seed', 'employee', 'employee',   '2025-04-14')
ON CONFLICT (email) DO NOTHING;

-- Aarushi Kohli: update user_type to contractor if exists
UPDATE users SET user_type = 'contractor' WHERE name = 'Aarushi Kohli' AND user_type != 'contractor';

-- Insert user_bios for job titles
INSERT INTO user_bios (user_id, job_title) VALUES
((SELECT id FROM users WHERE name = 'Derek Cheng'),       'Manager'),
((SELECT id FROM users WHERE name = 'Shreeya Laad'),      'Manager'),
((SELECT id FROM users WHERE name = 'Aarushi Kohli'),     'Contractor'),
((SELECT id FROM users WHERE name = 'Edward Hale'),       'Senior Associate'),
((SELECT id FROM users WHERE name = 'Colleen Liu'),       'Manager'),
((SELECT id FROM users WHERE name = 'Ethan McComb'),      'Senior Associate'),
((SELECT id FROM users WHERE name = 'Vishal Singh'),      'Director'),
((SELECT id FROM users WHERE name = 'Oumayma El Adaou'),  'Senior Associate'),
((SELECT id FROM users WHERE name = 'Shruti Bansal'),     'Associate'),
((SELECT id FROM users WHERE name = 'Anuj Shah'),         'Senior Manager'),
((SELECT id FROM users WHERE name = 'Ravneet Padda'),     'Senior Associate'),
((SELECT id FROM users WHERE name = 'Jeff West'),         'Senior Manager'),
((SELECT id FROM users WHERE name = 'Ashima Ghai'),       'Senior Manager'),
((SELECT id FROM users WHERE name = 'Ghazal Alghannam'),  'Associate'),
((SELECT id FROM users WHERE name = 'Adam Midden'),       'Senior Associate')
ON CONFLICT (user_id) DO UPDATE SET job_title = EXCLUDED.job_title;

-- ============================================
-- 1. BONUS CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bonus_config (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL DEFAULT 2025,
    active_milestone_sequence INTEGER NOT NULL DEFAULT 2,
    perf_weight DECIMAL(5,4) NOT NULL DEFAULT 0.80,
    tenure_weight DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. BONUS MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bonus_milestones (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES bonus_config(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    target_revenue BIGINT NOT NULL,
    profit_share_pct DECIMAL(5,4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonus_milestones_config ON bonus_milestones(config_id);

-- ============================================
-- 3. BONUS GUIDANCE RANGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bonus_guidance_ranges (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES bonus_config(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    target_range VARCHAR(10) NOT NULL,
    milestone2_pct DECIMAL(6,4) NOT NULL,
    milestone3_pct DECIMAL(6,4) NOT NULL,
    milestone4_pct DECIMAL(6,4) NOT NULL,
    UNIQUE(config_id, rating, target_range)
);

CREATE INDEX IF NOT EXISTS idx_bonus_guidance_config ON bonus_guidance_ranges(config_id);

-- ============================================
-- 4. BONUS EMPLOYEE DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bonus_employee_data (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES bonus_config(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    lcy_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    salary_lcy BIGINT NOT NULL DEFAULT 0,
    bonus_pct DECIMAL(6,4) NOT NULL DEFAULT 0,
    sign_on_bonus_lcy BIGINT NOT NULL DEFAULT 0,
    eligible BOOLEAN NOT NULL DEFAULT TRUE,
    spot_bonus_lcy BIGINT NOT NULL DEFAULT 0,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    target_range VARCHAR(10) CHECK (target_range IN ('Low', 'Medium', 'High')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonus_employee_config ON bonus_employee_data(config_id);
CREATE INDEX IF NOT EXISTS idx_bonus_employee_user ON bonus_employee_data(user_id);

-- ============================================
-- 5. SEED DATA
-- ============================================

-- Config
INSERT INTO bonus_config (year, active_milestone_sequence, perf_weight, tenure_weight)
VALUES (2025, 2, 0.80, 0.20);

-- Milestones
INSERT INTO bonus_milestones (config_id, sequence, target_revenue, profit_share_pct) VALUES
(1, 1, 10000000, 0.0000),
(1, 2, 12000000, 0.4000),
(1, 3, 14000000, 1.0000),
(1, 4, 15000000, 1.5000);

-- Guidance Ranges
INSERT INTO bonus_guidance_ranges (config_id, rating, target_range, milestone2_pct, milestone3_pct, milestone4_pct) VALUES
(1, 3, 'Low',    0.0150, 0.0400, 0.0600),
(1, 3, 'Medium', 0.0225, 0.0600, 0.0900),
(1, 3, 'High',   0.0300, 0.0800, 0.1200),
(1, 4, 'Low',    0.0200, 0.0600, 0.0900),
(1, 4, 'Medium', 0.0350, 0.0900, 0.1300),
(1, 4, 'High',   0.0500, 0.1200, 0.1700),
(1, 5, 'Low',    0.0400, 0.0800, 0.1500),
(1, 5, 'Medium', 0.0600, 0.1200, 0.1900),
(1, 5, 'High',   0.0800, 0.1600, 0.2300);

-- Employee Data
INSERT INTO bonus_employee_data
    (config_id, user_id, sort_order, lcy_currency, salary_lcy, bonus_pct, sign_on_bonus_lcy, eligible, spot_bonus_lcy, rating, target_range, is_active)
VALUES
(1, (SELECT id FROM users WHERE name = 'Derek Cheng'),        1,  'CAD', 100000,  0.1500, 0,     TRUE,  0,      5, 'Medium', TRUE),
(1, (SELECT id FROM users WHERE name = 'Shreeya Laad'),       2,  'INR', 2658480, 0.1000, 0,     TRUE,  100000, 5, 'High',   TRUE),
(1, (SELECT id FROM users WHERE name = 'Aarushi Kohli'),      3,  'CAD', 60000,   0.0000, 0,     FALSE, 0,      NULL, NULL,   TRUE),
(1, (SELECT id FROM users WHERE name = 'Edward Hale'),        4,  'CAD', 63840,   0.1500, 0,     TRUE,  7500,   5, 'Medium', TRUE),
(1, (SELECT id FROM users WHERE name = 'Colleen Liu'),        5,  'CAD', 100300,  0.0500, 0,     FALSE, 5000,   5, 'Medium', FALSE),
(1, (SELECT id FROM users WHERE name = 'Ethan McComb'),       6,  'CAD', 63840,   0.1500, 0,     TRUE,  7500,   5, 'Medium', TRUE),
(1, (SELECT id FROM users WHERE name = 'Vishal Singh'),       7,  'GBP', 114000,  0.1053, 12000, FALSE, 0,      NULL, NULL,   TRUE),
(1, (SELECT id FROM users WHERE name = 'Oumayma El Adaou'),   8,  'MAD', 350000,  0.0000, 0,     TRUE,  10000,  5, 'High',   TRUE),
(1, (SELECT id FROM users WHERE name = 'Shruti Bansal'),      9,  'INR', 650000,  0.0000, 0,     TRUE,  25000,  5, 'High',   TRUE),
(1, (SELECT id FROM users WHERE name = 'Anuj Shah'),          10, 'USD', 140000,  0.1500, 0,     FALSE, 0,      4, 'Low',    FALSE),
(1, (SELECT id FROM users WHERE name = 'Ravneet Padda'),      11, 'CAD', 105000,  0.0000, 0,     TRUE,  7500,   5, 'Medium', TRUE),
(1, (SELECT id FROM users WHERE name = 'Jeff West'),          12, 'CAD', 155000,  0.0800, 0,     TRUE,  2500,   4, 'Low',    TRUE),
(1, (SELECT id FROM users WHERE name = 'Ashima Ghai'),        13, 'CAD', 172000,  0.0500, 0,     TRUE,  5000,   4, 'Low',    TRUE),
(1, (SELECT id FROM users WHERE name = 'Ghazal Alghannam'),   14, 'CAD', 58000,   0.0620, 0,     TRUE,  0,      4, 'Medium', TRUE),
(1, (SELECT id FROM users WHERE name = 'Adam Midden'),        15, 'USD', 120000,  0.1000, 0,     FALSE, 0,      4, 'Low',    FALSE);

COMMIT;
