-- ============================================
-- Migration: Onboarding Checklists Module v2
-- Version: 2.0.0
-- Date: 2026-01-21
-- Description: Adds template-based checklist system with 4 types
-- ============================================

BEGIN;

-- ============================================
-- 0. ADD USER TYPE TO USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20)
  DEFAULT 'employee'
  CHECK (user_type IN ('employee', 'contractor', 'admin'));

-- ============================================
-- 1. CHECKLIST TEMPLATES TABLE
-- Stores the 4 checklist types
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_templates (
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

-- Insert the 4 template types
INSERT INTO checklist_templates (template_id, name, description, audience, trigger_event, is_recurring, recurrence_interval) VALUES
('ft-onboarding', 'Full-Time Employee Onboarding', 'Complete onboarding checklist for new full-time employees', 'employee', 'Assigned on hire', FALSE, NULL),
('contractor-onboarding', 'Contractor Onboarding', 'Onboarding checklist for contractors', 'contractor', 'Assigned on engagement start', FALSE, NULL),
('periodic-compliance', 'Periodic Compliance', 'Quarterly/Semi-Annual/Annual compliance checklist', 'all', 'Quarterly/Semi-Annual/Annual', TRUE, 'quarterly'),
('admin-preonboarding', 'Pre-Onboarding Tasks (Admin)', 'HR Admin tasks before new hire starts', 'admin', 'When new hire is added', FALSE, NULL)
ON CONFLICT (template_id) DO NOTHING;

-- ============================================
-- 2. CHECKLIST SECTIONS TABLE
-- Sections within each template
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_sections (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checklist_sections_template ON checklist_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_sections_order ON checklist_sections(template_id, section_order);

-- ============================================
-- 3. CHECKLIST TEMPLATE ITEMS TABLE
-- Items within each section
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_template_items (
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

CREATE INDEX IF NOT EXISTS idx_template_items_section ON checklist_template_items(section_id);
CREATE INDEX IF NOT EXISTS idx_template_items_order ON checklist_template_items(section_id, item_order);

-- ============================================
-- 4. USER CHECKLISTS TABLE
-- Assigned checklists per user
-- ============================================
CREATE TABLE IF NOT EXISTS user_checklists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at TIMESTAMP,
    period_label VARCHAR(50), -- 'Q1 2026', '2026 Annual', etc. for recurring checklists
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, template_id, period_label) -- prevent duplicate assignments for same period
);

CREATE INDEX IF NOT EXISTS idx_user_checklists_user ON user_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklists_template ON user_checklists(template_id);
CREATE INDEX IF NOT EXISTS idx_user_checklists_status ON user_checklists(status);
CREATE INDEX IF NOT EXISTS idx_user_checklists_due ON user_checklists(due_date);

-- ============================================
-- 5. USER CHECKLIST ITEMS TABLE
-- Progress on individual items
-- ============================================
CREATE TABLE IF NOT EXISTS user_checklist_items (
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

CREATE INDEX IF NOT EXISTS idx_user_checklist_items_checklist ON user_checklist_items(user_checklist_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_items_completed ON user_checklist_items(is_completed);

-- ============================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_checklist_templates_updated_at ON checklist_templates;
CREATE TRIGGER update_checklist_templates_updated_at
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_checklists_updated_at ON user_checklists;
CREATE TRIGGER update_user_checklists_updated_at
    BEFORE UPDATE ON user_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_checklist_items_updated_at ON user_checklist_items;
CREATE TRIGGER update_user_checklist_items_updated_at
    BEFORE UPDATE ON user_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. VIEW FOR CHECKLIST PROGRESS OVERVIEW
-- ============================================
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
         uc.status, uc.assigned_at, uc.due_date, uc.completed_at, assigner.name;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- SELECT * FROM checklist_templates;
-- SELECT * FROM checklist_sections;
-- SELECT * FROM checklist_template_items;
