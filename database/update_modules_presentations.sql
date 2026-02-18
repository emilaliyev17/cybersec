-- Update training modules: replace old text-based modules with two presentation modules
-- Run this against the GCP PostgreSQL database

-- Step 1: Deactivate all existing modules
UPDATE training_modules SET is_active = FALSE;

-- Step 2: Insert two new presentation-based modules
INSERT INTO training_modules (title, description, content_json, required_time_seconds, module_order, is_active) VALUES

-- Module 1: AI Best Practices
(
    'AI Best Practices & Responsible Usage',
    'Learn about responsible AI usage, data protection policies, and best practices for using AI tools at StrategyBRIX. Covers the Golden Rules, data handling, approved tools, and the Quick Decision Framework.',
    '{"type": "presentation", "presentation_id": "ai-best-practices", "sections": [{"id": "presentation", "title": "AI Best Practices & Responsible Usage"}]}',
    1,
    1,
    TRUE
),

-- Module 2: Phishing Awareness
(
    'Phishing Awareness Training',
    'Understand phishing threats, recognize red flags, and learn how to protect yourself and the organization from social engineering attacks. Covers email phishing, vishing, the STOP method, and incident response.',
    '{"type": "presentation", "presentation_id": "phishing-awareness", "sections": [{"id": "presentation", "title": "Phishing Awareness Training"}]}',
    1,
    2,
    TRUE
);

-- Step 3: Link new modules to all existing tracks
-- Get the IDs of the newly inserted modules and add them to all active tracks
INSERT INTO track_modules (track_id, module_id, display_order, is_required)
SELECT t.id, tm.id, tm.module_order, TRUE
FROM training_tracks t
CROSS JOIN training_modules tm
WHERE tm.is_active = TRUE
  AND tm.content_json::text LIKE '%presentation%'
ON CONFLICT DO NOTHING;
