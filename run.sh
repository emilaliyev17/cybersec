#!/bin/bash

# ==============================================================================
# Security Onboarding Application - Local Startup Script
# ==============================================================================

# Ensure we are in the directory where the script is located
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "🛡️  Starting Security Onboarding System..."
echo "=========================================="

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
# 2. Backend Setup & Start
# ------------------------------------------------------------------------------
echo "------------------------------------------"
echo "🔙 Setting up Backend..."
cd backend

# Environment file check
if [ ! -f .env ]; then
    echo "⚠️  .env not found. Creating from .env.example..."
    cp .env.example .env
    echo "❗ IMPORTANT: A new .env file was created in 'backend/'."
    echo "❗ Please check it and update DB_PASSWORD if your local Postgres requires one."
fi

# Dependencies check
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install --silent
fi

echo "🚀 Starting Backend Server (Port 5000)..."
# Start backend in background and save PID
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend running (PID: $BACKEND_PID)"

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
echo "🚀 Starting Frontend..."
echo "   The application will open in your browser shortly."
echo "   Press [Ctrl+C] to stop both servers."
echo "------------------------------------------"

# Trap exit signals to kill backend
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID; exit" INT TERM EXIT

# Start frontend (this will keep the script running)
npm run dev
