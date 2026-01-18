#!/bin/bash
echo "🗑️ Deleting emil@strategybrix.com..."

PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << 'EOF'
DELETE FROM user_progress WHERE user_id = (SELECT id FROM users WHERE email = 'emil@strategybrix.com');
DELETE FROM quiz_attempts WHERE user_id = (SELECT id FROM users WHERE email = 'emil@strategybrix.com');
DELETE FROM users WHERE email = 'emil@strategybrix.com';

SELECT id, name, email, role FROM users;
EOF

echo "✅ Deleted! Now register again on the website."
