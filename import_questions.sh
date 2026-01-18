#!/bin/bash
# Import 200 questions into Cloud SQL

echo "📥 Importing 200 questions into Cloud SQL..."

PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f database/insert_200_questions.sql

echo ""
echo "✅ Done! Checking question count..."

PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -c "SELECT COUNT(*) as total_questions FROM quiz_questions;"

echo ""
echo "🎉 Questions imported! Refresh the Admin Panel."
