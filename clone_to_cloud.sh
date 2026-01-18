#!/bin/bash
# Clone local PostgreSQL database to Cloud SQL

cd "$(dirname "$0")"

echo "🔄 Cloning Local DB → Cloud SQL"
echo "================================"

# 1. Start local PostgreSQL temporarily on port 5433
echo "📦 Starting local PostgreSQL on port 5433..."
brew services start postgresql@15 2>/dev/null || brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null
sleep 3

# 2. Create dump of local database
echo "📤 Creating dump of local database..."
pg_dump -h localhost -p 5432 -U postgres -d security_onboarding --no-owner --no-acl > /tmp/local_db_dump.sql 2>/dev/null

# Check if dump was created
if [ ! -s /tmp/local_db_dump.sql ]; then
    echo "⚠️  Local PostgreSQL not available on 5432. Trying alternative..."
    # Try with different port or socket
    pg_dump -U postgres -d security_onboarding --no-owner --no-acl > /tmp/local_db_dump.sql 2>/dev/null
fi

if [ ! -s /tmp/local_db_dump.sql ]; then
    echo "❌ Could not create dump. Local PostgreSQL may not have the database."
    echo "   Let's use the SQL files instead..."
    
    # Fallback: create combined SQL from all files
    echo "📦 Creating combined SQL from schema + seed files..."
    cat database/schema.sql > /tmp/local_db_dump.sql
    echo "" >> /tmp/local_db_dump.sql
    cat database/seed.sql >> /tmp/local_db_dump.sql
    echo "" >> /tmp/local_db_dump.sql
    cat database/migration_tracks.sql >> /tmp/local_db_dump.sql
    echo "" >> /tmp/local_db_dump.sql
    cat database/insert_200_questions.sql >> /tmp/local_db_dump.sql
    echo "" >> /tmp/local_db_dump.sql
    cat database/add_video_module.sql >> /tmp/local_db_dump.sql
fi

# Stop local PostgreSQL (we need port 5432 for Cloud SQL Proxy)
echo "🛑 Stopping local PostgreSQL..."
brew services stop postgresql@15 2>/dev/null
brew services stop postgresql@16 2>/dev/null
brew services stop postgresql 2>/dev/null
sleep 2

# 3. Make sure Cloud SQL Proxy is running
echo "🔌 Checking Cloud SQL Proxy..."
if ! lsof -i :5432 > /dev/null 2>&1; then
    echo "   Starting Cloud SQL Proxy..."
    ~/cloud-sql-proxy contract-management-473819:us-central1:strategybrix-postgres --port=5432 &
    sleep 4
fi

# 4. Drop and recreate tables in Cloud SQL
echo "🗑️  Clearing Cloud SQL database..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << 'EOF'
-- Drop all tables
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS training_modules CASCADE;
DROP TABLE IF EXISTS user_checklist_progress CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS user_bios CASCADE;
DROP TABLE IF EXISTS track_modules CASCADE;
DROP TABLE IF EXISTS training_tracks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS user_progress_summary CASCADE;
EOF

# 5. Import dump to Cloud SQL
echo "📥 Importing to Cloud SQL..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -f /tmp/local_db_dump.sql 2>&1 | grep -E "(ERROR|INSERT|CREATE|DROP)" | head -30

# 6. Verify
echo ""
echo "✅ Verifying import..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding << 'EOF'
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Modules: ' || COUNT(*) FROM training_modules;
SELECT 'Questions: ' || COUNT(*) FROM quiz_questions;
SELECT 'Tracks: ' || COUNT(*) FROM training_tracks;
EOF

# 7. Make sure emil@strategybrix.com is admin
echo ""
echo "👑 Ensuring emil@strategybrix.com is admin..."
PGPASSWORD=R0BrzoOYXWFkXRrqusb1ljrT psql -h 127.0.0.1 -p 5432 -U security_app -d security_onboarding -c "UPDATE users SET role = 'admin' WHERE email = 'emil@strategybrix.com';"

echo ""
echo "🎉 Clone complete! Refresh the Admin Panel."
