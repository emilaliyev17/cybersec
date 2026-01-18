#!/bin/bash
# Fix schema and import questions

echo "🔧 Fixing quiz_questions table schema..."

PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << 'EOF'

-- Add missing columns if they don't exist
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Show table structure
\d quiz_questions

EOF

echo ""
echo "📦 Importing 200 questions..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f database/insert_200_questions.sql

echo ""
echo "✅ Checking result..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -c "SELECT COUNT(*) as total_questions FROM quiz_questions;"

echo ""
echo "🎉 Done! Refresh Admin Panel."
