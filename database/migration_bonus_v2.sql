-- ============================================
-- Migration: Bonus Calculator v2
-- Version: 2.0.0
-- Date: 2026-03-10
-- Description: Adapt existing bonus schema for the bonus calculator UI.
--   Adds missing columns to employee_compensation to support:
--   - dynamic employee management (ts_man integration)
--   - row ordering, active/inactive toggle
-- ============================================

BEGIN;

-- employee_compensation already exists in production.
-- Make user_id nullable so ts_man employees (without a local user row) can be added.
ALTER TABLE employee_compensation ALTER COLUMN user_id DROP NOT NULL;

-- Add UI/operational columns
ALTER TABLE employee_compensation ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE employee_compensation ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ts_man integration columns
ALTER TABLE employee_compensation ADD COLUMN IF NOT EXISTS tsman_user_id INTEGER;
ALTER TABLE employee_compensation ADD COLUMN IF NOT EXISTS resource_name_override VARCHAR(255);
ALTER TABLE employee_compensation ADD COLUMN IF NOT EXISTS title_override VARCHAR(255);
ALTER TABLE employee_compensation ADD COLUMN IF NOT EXISTS hire_date_override DATE;

-- Add rating directly on employee_compensation so ts_man employees
-- (user_id = NULL) can also have a rating stored without needing performance_ratings
ALTER TABLE employee_compensation ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS idx_emp_comp_tsman ON employee_compensation(tsman_user_id);
CREATE INDEX IF NOT EXISTS idx_emp_comp_sort ON employee_compensation(program_id, sort_order);

COMMIT;
