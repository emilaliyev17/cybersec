#!/bin/bash
# Full import of all data to Cloud SQL

cd "$(dirname "$0")"

echo "📥 Full Data Import to Cloud SQL"
echo "================================="

PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << 'EOF'

-- Check current state
SELECT '=== Current State ===' as info;
SELECT 'Modules: ' || COUNT(*) FROM training_modules;
SELECT 'Questions: ' || COUNT(*) FROM quiz_questions;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Tracks: ' || COUNT(*) FROM training_tracks;

EOF

echo ""
echo "📦 Importing training modules..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f database/seed.sql 2>/dev/null || echo "Some seed data may already exist"

echo ""
echo "📦 Importing tracks migration..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f database/migration_tracks.sql 2>/dev/null || echo "Tracks may already exist"

echo ""
echo "📦 Importing 200 questions..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f database/insert_200_questions.sql

echo ""
echo "📦 Importing video module..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f database/add_video_module.sql 2>/dev/null || echo "Video module may already exist"

echo ""
echo "=== Final State ==="
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << 'EOF'
SELECT 'Modules: ' || COUNT(*) FROM training_modules;
SELECT 'Questions: ' || COUNT(*) FROM quiz_questions;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Tracks: ' || COUNT(*) FROM training_tracks;
EOF

echo ""
echo "✅ Full import complete! Refresh Admin Panel."
