# Employee Onboarding Security Application

A comprehensive PERN stack (PostgreSQL, Express, React, Node.js) application for security awareness training with 2025 threat landscape content.

## Features

### v2.0 (Advanced Admin & Checklists)
- **Admin Control Center**: New high-performance dashboard for HR/Admin.
  - **Bulk Assignment**: Assign compliance checklists to multiple users in one click.
  - **Real-time Stats**: Track completion rates and compliance health across the company.
  - **Template Management**: Visual management of the 4 core templates (FTE, Contractor, Compliance, Pre-onboarding).
- **Advanced Checklist System**: Template-based checklists decoupled from training tracks.
  - **User Types**: Distinct flows for Employees, Contractors, and Admins.
  - **Recurring Tasks**: Support for annual/quarterly compliance tasks.
- **Enhanced Data Structure**: Consolidated schema supporting complex user states.

### Core Features (v1.0)
- **Training Tracks**: Learning paths (FULL vs CONDENSED).
- **Security Quiz**: 80% pass rule with "fail twice = reset" logic.
- **2025 Threat Curriculum**: Deepfakes, Quishing, ClickFix, BEC.
- **Bio Editor**: For generating employee profiles.
- **Modern Dashboard**: Tailwind CSS design with progress tracking.

---

## Quick Start (Recommended)

### Prerequisites
- Node.js 18+
- Google Cloud SDK (authenticated)

### One-Command Launch (Cloud SQL)

```bash
cd security-onboarding
./run.sh
```

---

## Architecture

```
security-onboarding/
├── database/
│   ├── schema.sql           # CONSOLIDATED V2 Schema
├── backend/
│   ├── routes/
│   │   ├── checklistsV2.js  # [NEW] Advanced Checklist API with Bulk Actions
│   │   ├── auth.js          # JWT authentication
│   │   └── ...
├── frontend/
│   └── src/components/
│       ├── admin/
│       │   ├── ChecklistManagement.jsx # [NEW] Advanced HR Admin Panel
│       │   └── ...
│       ├── UserChecklists.jsx # V2 Checklist Dashboard for employees
│       └── ...
└── run.sh                   # Cloud SQL Launch Script
```
