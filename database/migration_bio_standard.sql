-- Migration: Bio Standard Updates
-- Adds fields for Credentials, Structured Projects, and Strict Expertise

ALTER TABLE user_bios 
ADD COLUMN IF NOT EXISTS credentials VARCHAR(255),
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS expertise TEXT[] DEFAULT '{}';

-- Optional: Migrate existing skills to expertise if they exist and count <= 5
-- This is a one-time migration and might not be perfect for everyone
-- UPDATE user_bios SET expertise = skills WHERE array_length(skills, 1) <= 5 AND (expertise IS NULL OR array_length(expertise, 1) = 0);

COMMENT ON COLUMN user_bios.credentials IS 'Professional certifications/credentials (e.g. CAMS, PMP)';
COMMENT ON COLUMN user_bios.projects IS 'List of 4-6 projects with Category, Client, Work, and Outcome';
COMMENT ON COLUMN user_bios.expertise IS 'List of exactly 5 areas of expertise';
