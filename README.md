# Employee Onboarding Security Application

A comprehensive PERN stack (PostgreSQL, Express, React, Node.js) application for security awareness training with 2025 threat landscape content.

## Features

- **Modern Dashboard UI**: Tailwind CSS responsive design with progress tracking
- **Focus Tracking**: Pauses training when user tabs away, ensuring engagement
- **80% Pass Rule**: Strict quiz logic - failing resets all training progress
- **2025 Threat Curriculum**:
  - Deepfakes & AI Impersonation
  - Quishing (QR Phishing)
  - ClickFix Browser Threats
  - BEC & Pretexting

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Database Setup

```bash
# Create database
createdb security_onboarding

# Run schema and seed
psql -d security_onboarding -f database/schema.sql
psql -d security_onboarding -f database/seed.sql
```

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Architecture

```
security-onboarding/
├── database/
│   ├── schema.sql      # PostgreSQL schema with FK constraints
│   └── seed.sql        # 2025 threat modules & quiz questions
├── backend/
│   ├── routes/
│   │   ├── auth.js     # JWT authentication
│   │   ├── modules.js  # Training module endpoints
│   │   └── quiz.js     # Quiz with 80% rule logic
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── Dashboard.jsx      # Main dashboard
        │   ├── TrainingViewer.jsx # Focus-tracked module viewer
        │   ├── Quiz.jsx           # Assessment component
        │   └── Login.jsx
        └── hooks/
            └── useFocusTracking.js
```

## Key Logic: The 80% Rule

When a user submits the quiz:

1. **Score >= 80%**: User is marked as "Certified"
2. **Score < 80%**:
   - All `user_progress.is_completed` flags reset to FALSE
   - User must retake all training modules
   - Previous certification (if any) is revoked

See `backend/routes/quiz.js:POST /submit` for implementation.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/modules | Get all modules with progress |
| POST | /api/modules/:id/progress | Update module progress |
| GET | /api/quiz/questions | Get quiz (requires all modules complete) |
| POST | /api/quiz/submit | Submit quiz, handles 80% rule |

## Demo Credentials

```
Email: john.smith@company.com
Password: password123
```
