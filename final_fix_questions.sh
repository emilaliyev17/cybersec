#!/bin/bash
echo "🔧 Adding missing column and importing questions..."

PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << 'EOF'
-- Add missing columns
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EOF

echo "📥 Importing 200 questions..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f database/insert_200_questions.sql

echo ""
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -c "SELECT COUNT(*) as questions FROM quiz_questions;"

echo "✅ Done!"
