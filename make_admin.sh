#!/bin/bash
# Make emil@strategybrix.com an admin

echo "🔧 Making emil@strategybrix.com an admin..."

PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << EOF
UPDATE users SET role = 'admin' WHERE email = 'emil@strategybrix.com';
SELECT id, name, email, role FROM users;
EOF

echo ""
echo "✅ Done! Now log out and log back in to see admin panel."
