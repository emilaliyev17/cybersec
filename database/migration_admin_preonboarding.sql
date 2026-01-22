-- ============================================
-- Migration: Admin Pre-Onboarding Enhancement
-- Version: 2.1.0
-- Date: 2026-01-22
-- Description: Adds target_user_id for admin pre-onboarding checklists
-- ============================================

BEGIN;

-- Add target_user_id to user_checklists
-- This field is used for admin-preonboarding checklists to track
-- which new employee the checklist is for
ALTER TABLE user_checklists
ADD COLUMN IF NOT EXISTS target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_checklists_target ON user_checklists(target_user_id);

-- Update the unique constraint to include target_user_id for admin checklists
-- First drop the old constraint if it exists
ALTER TABLE user_checklists DROP CONSTRAINT IF EXISTS user_checklists_user_id_template_id_period_label_key;

-- Create new unique constraint that accounts for target_user_id
-- This allows same admin to have multiple pre-onboarding checklists for different employees
ALTER TABLE user_checklists
ADD CONSTRAINT user_checklists_unique_assignment
UNIQUE NULLS NOT DISTINCT (user_id, template_id, period_label, target_user_id);

COMMIT;
