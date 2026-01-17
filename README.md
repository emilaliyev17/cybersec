# Employee Onboarding Security Application

A comprehensive PERN stack (PostgreSQL, Express, React, Node.js) application for security awareness training with 2025 threat landscape content.

## Features

- **Training Tracks**: Two learning paths (FULL for new employees, CONDENSED for existing)
- **Admin Track Management**: Admins can assign modules to tracks via checkbox UI
- **20-Step Onboarding Checklist**: For FULL track users
- **Bio Editor**: For CONDENSED track users
- **Modern Dashboard UI**: Tailwind CSS responsive design with progress tracking
- **Focus Tracking**: Pauses training when user tabs away
- **80% Pass Rule**: Failing quiz resets all training progress
- **2025 Threat Curriculum**:
  - Deepfakes & AI Impersonation
  - Quishing (QR Phishing)
  - ClickFix Browser Threats
  - BEC & Pretexting
  - Security Videos

---

## Quick Start (Recommended)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (running)

### One-Command Launch

```bash
cd security-onboarding
./run.sh
```

This script will:
1. Check PostgreSQL connection
2. Create database if needed
3. Apply migrations (including Training Tracks)
4. Install dependencies
5. Start Backend (port 5001) and Frontend (port 3000)

**Open**: http://localhost:3000

---

## Manual Setup

### 1. Database Setup

```bash
# Create database
createdb security_onboarding

# Run schema and seed
psql -d security_onboarding -f database/schema.sql
psql -d security_onboarding -f database/seed.sql

# Apply training tracks migration
psql -d security_onboarding -f database/migration_tracks.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials if needed
npm install
npm run dev
```

### 3. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

---

## Stopping the Application

Press `Ctrl+C` in the terminal running `run.sh`

Or manually kill processes:
```bash
pkill -f "node.*security-onboarding"
```

---

## Ports

| Service  | Port |
|----------|------|
| Frontend | 3000 |
| Backend  | 5001 |
| PostgreSQL | 5432 |

---

## Training Tracks

| Track | Target Audience | Features |
|-------|-----------------|----------|
| **FULL** | New employees | All modules + 20-step onboarding checklist |
| **CONDENSED** | Existing employees | Selected modules + Bio update |

### Admin: Assign Track to User
1. Login as admin
2. Go to **Users** tab
3. Click on a user
4. Select track from dropdown

### Admin: Manage Track Modules
1. Login as admin
2. Go to **Tracks** tab
3. Use checkboxes to add/remove modules from each track

---

## Architecture

```
security-onboarding/
├── database/
│   ├── schema.sql           # Base PostgreSQL schema
│   ├── seed.sql             # Training modules & quiz questions
│   └── migration_tracks.sql # Training tracks tables
├── backend/
│   ├── routes/
│   │   ├── auth.js          # JWT authentication
│   │   ├── modules.js       # Training modules (track-aware)
│   │   ├── quiz.js          # Quiz with 80% rule
│   │   ├── tracks.js        # Track management
│   │   ├── checklist.js     # Onboarding checklist
│   │   ├── bio.js           # User bio
│   │   └── admin.js         # Admin endpoints
│   └── server.js
├── frontend/
│   └── src/components/
│       ├── Dashboard.jsx
│       ├── OnboardingChecklist.jsx
│       ├── BioEditor.jsx
│       └── admin/
│           ├── AdminDashboard.jsx
│           ├── TrackManagement.jsx
│           ├── TrackSelector.jsx
│           └── UserManagement.jsx
└── run.sh                   # One-command launcher
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |

### Modules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/modules | Get modules (filtered by user's track) |
| POST | /api/modules/:id/progress | Update module progress |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quiz/questions | Get quiz questions |
| POST | /api/quiz/submit | Submit quiz (80% rule) |

### Tracks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tracks | Get all tracks |
| GET | /api/tracks/my-track | Get current user's track |
| GET | /api/tracks/:id/modules | Get track modules |

### Checklist (FULL track)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/checklist | Get checklist items |
| PUT | /api/checklist/:itemId | Update item status |

### Bio (CONDENSED track)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bio | Get user bio |
| PUT | /api/bio | Update user bio |

---

## Demo Credentials

```
Admin:
  Email: admin@company.com
  Password: password123

Employee:
  Email: john.smith@company.com
  Password: password123
```

---

## Troubleshooting

### Port already in use
```bash
# Kill processes on ports
lsof -ti :5001 | xargs kill -9
lsof -ti :3000 | xargs kill -9
```

**Note**: Port 5000 is used by macOS AirPlay, so we use port 5001 for the backend.

### Database connection error
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep security_onboarding
```

### Registration error "An error occurred"
Check backend logs:
```bash
tail -50 backend/backend.log
```
