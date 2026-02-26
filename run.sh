#!/bin/bash

# ==============================================================================
# Security Onboarding Application - Startup Script (Cloud SQL)
# ==============================================================================

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "🛡️  Starting Security Onboarding System..."
echo "=========================================="

# ------------------------------------------------------------------------------
# 0. Check gcloud authentication
# ------------------------------------------------------------------------------
echo "🔑 Checking gcloud authentication..."

# Test if auth is valid
if ! gcloud auth application-default print-access-token &>/dev/null; then
    echo "⚠️  gcloud auth expired or not configured."
    echo ""
    echo "   Running: gcloud auth application-default login"
    echo ""
    gcloud auth application-default login

    # Check again after login
    if ! gcloud auth application-default print-access-token &>/dev/null; then
        echo "❌ Authentication failed. Please try manually:"
        echo "   gcloud auth application-default login"
        exit 1
    fi
fi
echo "✅ gcloud authenticated"

# ------------------------------------------------------------------------------
# 1. Check Cloud SQL Proxy
# ------------------------------------------------------------------------------
PROXY_PATH="$HOME/cloud-sql-proxy"
if [ ! -f "$PROXY_PATH" ]; then
    echo "📥 Cloud SQL Proxy not found. Downloading..."
    curl -o "$PROXY_PATH" https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.darwin.arm64
    chmod +x "$PROXY_PATH"
    echo "✅ Cloud SQL Proxy installed"
fi

# ------------------------------------------------------------------------------
# 2. Kill any existing processes on our ports
# ------------------------------------------------------------------------------
echo "🧹 Cleaning up old processes..."

# Stop local PostgreSQL if running (we use Cloud SQL)
brew services stop postgresql@14 2>/dev/null
brew services stop postgresql@15 2>/dev/null
brew services stop postgresql@16 2>/dev/null
brew services stop postgresql 2>/dev/null
pg_ctl stop -D /usr/local/var/postgres 2>/dev/null
pg_ctl stop -D /opt/homebrew/var/postgres 2>/dev/null

# Kill any processes on our ports (leave Docker postgres alone)
pkill -f "cloud-sql-proxy" 2>/dev/null
pkill -f "nodemon.*security-onboarding" 2>/dev/null
lsof -ti :5001 | xargs kill -9 2>/dev/null
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :5433 | xargs kill -9 2>/dev/null

sleep 2
echo "✅ Ports cleared"

# ------------------------------------------------------------------------------
# 3. Start Cloud SQL Proxy
# ------------------------------------------------------------------------------
echo "🔌 Connecting to Cloud SQL..."
$PROXY_PATH contract-management-473819:us-central1:strategybrix-postgres --port=5433 > /dev/null 2>&1 &
PROXY_PID=$!
sleep 3

# Check if proxy started
if ! kill -0 $PROXY_PID 2>/dev/null; then
    echo "❌ Failed to start Cloud SQL Proxy. Check your gcloud auth."
    echo "   Run: gcloud auth application-default login"
    exit 1
fi
echo "✅ Connected to Cloud SQL (strategybrix-postgres)"

# ------------------------------------------------------------------------------
# 4. Backend Setup & Start
# ------------------------------------------------------------------------------
echo "------------------------------------------"
echo "🔙 Setting up Backend..."
cd backend

# Set environment variables for Cloud SQL
export PORT=5001
export NODE_ENV=development
export DB_HOST=localhost
export DB_PORT=5433
export DB_NAME=security_onboarding
export DB_USER=security_app
export DB_PASSWORD=R0BrzoOYXWFkXRrqusb1ljrT
export JWT_SECRET=$(timeout 5 gcloud secrets versions access latest --secret=jwt-secret 2>/dev/null || echo "dev-jwt-secret-fallback")
export FRONTEND_URL=http://localhost:3000

# Dependencies check
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install --silent
fi

echo "🚀 Starting Backend Server (Port 5001)..."
npm run dev > backend.log 2>&1 &
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
# 5. Frontend Setup & Start
# ------------------------------------------------------------------------------
echo "------------------------------------------"
echo "🖥️  Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install --silent
fi

# ------------------------------------------------------------------------------
# 6. Running & Cleanup
# ------------------------------------------------------------------------------
echo "------------------------------------------"
echo "✅ READY! (Connected to Cloud SQL)"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo "   Database: ☁️  Cloud SQL (strategybrix-postgres)"
echo ""
echo "   Press [Ctrl+C] to stop all servers."
echo "------------------------------------------"

# Trap exit signals to kill all processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $PROXY_PID 2>/dev/null
    lsof -ti :5001 | xargs kill -9 2>/dev/null
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    pkill -f "cloud-sql-proxy" 2>/dev/null
    echo "👋 Goodbye!"
    exit 0
}
trap cleanup INT TERM EXIT

# Start frontend (this will keep the script running)
npm run dev
