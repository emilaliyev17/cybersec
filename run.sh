#!/bin/bash

# ==============================================================================
# Security Onboarding Application - Local Startup Script
# ==============================================================================

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "🛡️  Starting Security Onboarding System..."
echo "=========================================="

# ------------------------------------------------------------------------------
# 0. Kill any existing processes on our ports
# ------------------------------------------------------------------------------
echo "🧹 Cleaning up old processes..."
lsof -ti :5001 | xargs kill -9 2>/dev/null
lsof -ti :3000 | xargs kill -9 2>/dev/null
pkill -f "nodemon.*security-onboarding" 2>/dev/null
sleep 1
echo "✅ Ports 5001 and 3000 are free"

# ------------------------------------------------------------------------------
# 1. Database Check & Setup
# ------------------------------------------------------------------------------
echo "🗄️  Checking Database..."

if ! command -v psql &> /dev/null; then
    echo "❌ Error: PostgreSQL (psql) is not installed or not in PATH."
    exit 1
fi

if psql -lqt | cut -d \| -f 1 | grep -qw security_onboarding; then
    echo "✅ Database 'security_onboarding' found."
else
    echo "⚠️  Database 'security_onboarding' not found. Creating..."
    createdb security_onboarding
    if [ $? -eq 0 ]; then
        echo "   Importing Schema..."
        psql -d security_onboarding -f database/schema.sql
        echo "   Seeding Data..."
        psql -d security_onboarding -f database/seed.sql
        echo "✅ Database created and seeded successfully."
    else
        echo "❌ Failed to create database. Please check your PostgreSQL setup."
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 1.1 Apply Training Tracks Migration
# ------------------------------------------------------------------------------
echo "🔄 Checking Training Tracks migration..."

if psql -d security_onboarding -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_tracks');" | grep -q 't'; then
    echo "✅ Training Tracks migration already applied."
else
    echo "📦 Applying Training Tracks migration..."
    psql -d security_onboarding -f database/migration_tracks.sql
    if [ $? -eq 0 ]; then
        echo "✅ Training Tracks migration applied successfully."
    else
        echo "❌ Failed to apply migration. Check database/migration_tracks.sql"
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 2. Backend Setup & Start
# ------------------------------------------------------------------------------
echo "------------------------------------------"
echo "🔙 Setting up Backend..."
cd backend

# Environment file check
if [ ! -f .env ]; then
    echo "⚠️  .env not found. Creating from .env.example..."
    cp .env.example .env
fi

# Dependencies check
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install --silent
fi

echo "🚀 Starting Backend Server (Port 5001)..."
PORT=5001 npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Check if backend started successfully
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:5001"
else
    echo "⚠️  Backend may still be starting..."
fi

cd "$PROJECT_ROOT"

# ------------------------------------------------------------------------------
# 3. Frontend Setup & Start
# ------------------------------------------------------------------------------
echo "------------------------------------------"
echo "🖥️  Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install --silent
fi

# ------------------------------------------------------------------------------
# 4. Running & Cleanup
# ------------------------------------------------------------------------------
echo "------------------------------------------"
echo "✅ READY!"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo ""
echo "   Press [Ctrl+C] to stop all servers."
echo "------------------------------------------"

# Trap exit signals to kill backend
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    lsof -ti :5001 | xargs kill -9 2>/dev/null
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    echo "👋 Goodbye!"
    exit 0
}
trap cleanup INT TERM EXIT

# Start frontend (this will keep the script running)
npm run dev
