-- Add Video Training Module
-- Run this after the initial seed.sql

INSERT INTO training_modules (title, description, content_json, required_time_seconds, module_order) VALUES
(
    'Security Awareness Videos',
    'Watch short video demonstrations of real-world security threats and learn how to protect yourself.',
    '{
        "type": "video",
        "videos": [
            {
                "title": "Introduction to Security Awareness",
                "description": "A brief overview of why security awareness matters in today''s digital workplace.",
                "url": "https://storage.googleapis.com/securitytrainingvideos/1.mp4"
            }
        ],
        "key_takeaways": [
            "Visual examples help recognize real threats",
            "Security awareness is everyone''s responsibility",
            "Report suspicious activity immediately"
        ]
    }',
    300,
    5
);

-- Add progress records for existing users
INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds)
SELECT u.id, tm.id, FALSE, 0
FROM users u
CROSS JOIN training_modules tm
WHERE tm.title = 'Security Awareness Videos'
  AND NOT EXISTS (
    SELECT 1 FROM user_progress up
    WHERE up.user_id = u.id AND up.module_id = tm.id
  );
