# AgencyDesk 🚀

> A cutting-edge, multi-tenant agency & client management platform built with Next.js 14, FastAPI, and PostgreSQL.

AgencyDesk is designed from the ground up to handle complex multi-tenant environments. It features rigorous data isolation, comprehensive client visibility filtering, and a flexible multi-agency identity model.

---

## 🏗 Architecture Overview

AgencyDesk leverages a robust, decoupled architecture:
- **Frontend**: Next.js 14 with App Router, TailwindCSS, and shadcn/ui.
- **Backend**: FastAPI for high-performance, async API endpoints.
- **Database**: PostgreSQL with strict row-level multitenancy, powered by SQLAlchemy and Alembic.

---

## ✨ Features

- **Strict Tenant Isolation**: Data is separated by `agency_id` at the database level.
- **Role-Based Visibility**: Internal data (tasks, comments, attachments) are safely hidden from client users.
- **Multi-Agency Identity**: A single user identity can participate across multiple agencies with different roles.
- **Idempotent Invites**: Bulletproof member invitation logic.
- **Safe Removal**: Prevent cascading deletes when removing agency members.

---

## 📊 Core Flows & Mermaid Diagrams

### 1. Database Schema Overview
```mermaid
erDiagram
    AGENCY {
        uuid id PK
        string name
        string slug
    }
    USER {
        uuid id PK
        string email
        string hashed_password
    }
    MEMBERSHIP {
        uuid id PK
        uuid user_id FK
        uuid agency_id FK
        string role
    }
    PROJECT {
        uuid id PK
        uuid agency_id FK
        string name
    }
    TASK {
        uuid id PK
        uuid agency_id FK
        uuid project_id FK
        uuid assignee_membership_id FK
        boolean is_internal
        string title
    }

    AGENCY ||--o{ MEMBERSHIP : "has"
    USER ||--o{ MEMBERSHIP : "belongs to"
    AGENCY ||--o{ PROJECT : "contains"
    PROJECT ||--o{ TASK : "has"
    MEMBERSHIP ||--o{ TASK : "assigned to"
```

### 2. Multi-Tenant Auth Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant DB as Database
    
    C->>A: POST /login (email, password, agency_id)
    A->>DB: Query User by email
    DB-->>A: Return User
    A->>DB: Query Membership by user_id & agency_id
    DB-->>A: Return Membership (Role)
    A->>A: Generate JWT scoped to agency_id & Role
    A-->>C: Return JWT
    
    Note over C,A: Subsequent requests include JWT
    
    C->>A: GET /projects
    A->>A: Verify JWT & extract agency_id
    A->>DB: Query Projects WHERE agency_id = JWT.agency_id
    DB-->>A: Return Isolated Projects
    A-->>C: 200 OK
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js >= 18 (for local development)
- Python >= 3.11 (for local development)

### Running the Stack via Docker
1. Clone the repository:
   ```bash
   git clone <repo-url> && cd agency-desk
   ```
2. Start the services:
   ```bash
   docker-compose up --build
   ```
3. The backend applies migrations and seeds the database automatically.
4. Open the frontend: [http://localhost:3000](http://localhost:3000)
5. Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Demo Credentials

The `seed.py` creates demo users (Password for all: `password123`):

| Agency | Role | Email |
|--------|------|-------|
| Alpha  | Admin | `admin@alpha.com` |
| Alpha  | Member | `member@alpha.com` |
| Alpha  | Client | `client@acme.com` |
| Beta   | Admin | `admin@beta.com` |
| Both   | Mixed | `crossuser@example.com` |

---

## 🧪 Testing

The backend includes a comprehensive pytest suite covering the 5 critical edge cases:
- Tenant isolation
- Visibility filtering
- Multi-agency auth
- Invite idempotency
- Safe removal

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest tests/ -v
```

---
*Built with passion to manage the world's best agencies.*
