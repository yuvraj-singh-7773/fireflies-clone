# Firefiles

**Meeting Notes & Transcription Platform** — a Fireflies.ai-inspired full-stack application for recording, transcribing, and summarizing meetings with interactive transcripts, AI summaries, action items, and team collaboration features.

> Built with Next.js 14, FastAPI, SQLAlchemy, and SQLite.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Frontend Structure](#frontend-structure)
6. [Backend Structure](#backend-structure)
7. [Database Schema](#database-schema)
8. [API Overview](#api-overview)
9. [Local Setup Instructions](#local-setup-instructions)
10. [Environment Variables](#environment-variables)
11. [Development Commands](#development-commands)
12. [Testing Instructions](#testing-instructions)
13. [Deployment Instructions](#deployment-instructions)
14. [Assumptions](#assumptions)
15. [Mocked / Placeholder Functionality](#mocked--placeholder-functionality)
16. [Known Limitations](#known-limitations)

---

## Project Overview

Firefiles is a full-stack Meeting Notes & Transcription Platform inspired by [Fireflies.ai](https://fireflies.ai). It allows users to browse, search, and manage meetings with interactive transcripts, AI-generated summaries, action item tracking, comments, highlights, and a global search — all behind JWT-based authentication with per-user meeting ownership isolation.

The platform consists of:
- A **Next.js 14 App Router** frontend with Tailwind CSS for a polished, responsive, dark-mode UI
- A **FastAPI** backend with SQLAlchemy ORM and SQLite persistence
- A **REST/JSON API** connecting the two via a centralized API client

---

## Features

### Core (Must Have)
- **Meetings Library / Dashboard** — paginated list with search by title, filter by participant, date range presets, tag filtering, and multi-sort (date desc/asc, title asc)
- **Meeting CRUD** — create, update, and delete meetings with toast notifications and confirmation dialogs
- **Meeting Detail Page** — sticky header with metadata, participant avatars, tags, status, and duration
- **Interactive Media Player** — play/pause, seek bar, ±5s skip, variable speed (0.75x–2x), volume/mute, waveform visualization
- **Interactive Transcript** — speaker labels, timestamps, click-to-seek, playback-driven active segment sync, auto-scroll toggle
- **Transcript Search** — case-insensitive search with real-time word highlighting, match counter ("X of Y"), next/previous navigation, keyboard shortcuts
- **Chapters / Topics** — timeline cards with active chapter tracking, click-to-navigate
- **AI Summary** — overview paragraph and key topics pills (seeded/mock data)
- **Action Items CRUD** — create, edit, toggle completion, delete, progress counter, assignee, due date, overdue warnings
- **Authentication** — JWT registration/login/logout, protected routes, token persistence, invalid-token handling, `/api/auth/me`
- **Meeting Ownership Isolation** — each user can only access their own meetings and all child resources (transcripts, chapters, summaries, action items, comments, highlights); cross-user access returns 404

### Bonus Features (Implemented)
- **Comments** — per-transcript-segment threaded comments with author names, validation, deletion, retry
- **Highlights** — per-transcript-segment highlighting with idempotent toggle
- **Global Search** — unified search across meeting titles, participant names, and transcript text with paginated results
- **Tags / Topics** — persisted tags with color codes, attach/detach from meetings, filter meetings by tag
- **Responsive Design** — desktop, tablet, and mobile layouts with collapsible sidebar

---

## Tech Stack

| Layer      | Technology                                    | Version   |
|------------|-----------------------------------------------|-----------|
| Frontend   | Next.js (App Router)                          | 14.2.3    |
| UI         | React + Tailwind CSS                          | 18 / 3.4  |
| Language   | TypeScript (strict)                           | 5.x       |
| Backend    | Python, FastAPI                               | 3.11+, 0.111+ |
| ORM        | SQLAlchemy 2.x (declarative, Mapped style)    | 2.0+      |
| Validation | Pydantic v2 + pydantic-settings               | 2.x       |
| Auth       | JWT (PyJWT), PBKDF2-SHA256 password hashing   |           |
| Database   | SQLite                                        |           |
| Testing    | pytest + httpx + pytest-asyncio               |           |
| API        | REST / JSON                                   |           |

---

## Architecture

```
Browser
  │
  │  HTTP GET/POST/PUT/DELETE (JSON + Bearer token)
  ▼
Next.js Frontend (port 3000)
  │
  │  lib/api/client.ts  →  NEXT_PUBLIC_API_URL
  │
  ▼
FastAPI Backend (port 8000)
  │
  ├── app/routes/        ← HTTP layer only; no business logic
  │       │
  │       ▼
  ├── app/services/      ← Business logic, ownership checks
  │       │
  │       ▼
  ├── app/repositories/  ← All SQLAlchemy queries
  │       │
  │       ▼
  └── SQLAlchemy ORM
          │
          ▼
       SQLite (firefiles.db)
```

All API calls from the frontend go through the centralized `lib/api/client.ts` module. No component calls `fetch()` directly. The backend enforces a strict three-layer separation: Routes → Services → Repositories (see `DECISIONS.md` ADR-007).

---

## Frontend Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout with AuthProvider, sidebar, header
│   ├── page.tsx             # Dashboard / meetings library (home page)
│   ├── login/page.tsx       # Login page
│   ├── register/page.tsx    # Registration page
│   └── meetings/[id]/page.tsx  # Meeting detail workspace
├── components/
│   ├── auth/                # AuthProvider, RequireAuth wrapper
│   ├── layout/              # Header, Sidebar
│   ├── meetings/            # TranscriptViewer, TranscriptSegment, Comments
│   └── ui/                  # Icons, reusable UI primitives
├── hooks/                   # Custom React hooks (useHealth, useToast)
├── lib/api/
│   ├── client.ts            # Base request(), error handling, token management
│   ├── auth.ts              # register, login, getMe
│   └── meetings.ts          # All meeting CRUD, transcripts, summaries, etc.
└── types/
    └── index.ts             # Shared TypeScript interfaces
```

---

## Backend Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point, CORS, lifespan
│   ├── config.py            # Settings via pydantic-settings (.env)
│   ├── database.py          # Engine, SessionLocal, Base, init_db()
│   ├── security.py          # JWT encode/decode, password hash/verify, get_current_user
│   ├── routes/
│   │   ├── api.py           # All API route handlers (auth, meetings, sub-resources)
│   │   └── health.py        # GET /api/health
│   ├── services/
│   │   └── services.py      # Business logic, ownership enforcement
│   ├── repositories/
│   │   └── repositories.py  # SQLAlchemy query layer
│   ├── models/
│   │   └── models.py        # ORM table definitions (10 models)
│   ├── schemas/
│   │   └── schemas.py       # Pydantic request/response schemas
│   ├── exceptions/          # Custom error types and global handlers
│   └── utils/
│       └── seed.py          # Development seed data script
├── tests/
│   ├── conftest.py          # Test helpers (auth_headers)
│   ├── test_health.py       # Health endpoint test
│   ├── test_milestone2.py   # Comprehensive CRUD + ownership tests
│   └── test_comments.py     # Comment CRUD tests
├── requirements.txt         # Python dependencies
├── pyproject.toml           # pytest configuration
└── .env.example             # Template environment variables
```

---

## Database Schema

```
User ──────────────── Meeting ─────────────── TranscriptSegment
                         │                         │
                         ├── Participant            ├── TranscriptHighlight
                         ├── Summary                └── TranscriptComment
                         ├── ActionItem
                         ├── Chapter
                         └── MeetingTag ──── Tag
```

### Tables

| Table                  | Key Columns                                                    |
|------------------------|----------------------------------------------------------------|
| `users`                | id, email (unique), display_name, password_hash, avatar_url    |
| `meetings`             | id, title, date, duration_sec, audio_url, status, owner_id (FK→users) |
| `participants`         | id, meeting_id (FK), name, email, speaker_id                  |
| `transcript_segments`  | id, meeting_id (FK), participant_id (FK), text, start_ms, end_ms, sequence |
| `summaries`            | id, meeting_id (FK, unique), overview, key_topics (JSON string) |
| `action_items`         | id, meeting_id (FK), assignee, task, due_date, completed       |
| `chapters`             | id, meeting_id (FK), title, start_ms, end_ms, sequence         |
| `tags`                 | id, name (unique), color                                       |
| `meeting_tag`          | meeting_id (FK), tag_id (FK) — many-to-many                   |
| `transcript_highlights`| id, meeting_id (FK), segment_id (FK), created_at — unique per segment |
| `transcript_comments`  | id, meeting_id (FK), segment_id (FK), text, author_name, created_at |

All IDs are UUID v4 stored as `String(36)`. Timestamps use UTC.

---

## API Overview

Interactive documentation: `http://localhost:8000/docs` (Swagger UI)

### Authentication
| Method | Path                 | Description                    | Auth |
|--------|----------------------|--------------------------------|------|
| POST   | `/api/auth/register` | Register, returns bearer token | No   |
| POST   | `/api/auth/login`    | Login, returns bearer token    | No   |
| GET    | `/api/auth/me`       | Current authenticated user     | Yes  |

### Meetings
| Method | Path                 | Description              | Auth |
|--------|----------------------|--------------------------|------|
| GET    | `/api/meetings`      | List meetings (paginated)| Yes  |
| POST   | `/api/meetings`      | Create meeting           | Yes  |
| GET    | `/api/meetings/{id}` | Get meeting detail       | Yes  |
| PUT    | `/api/meetings/{id}` | Update meeting           | Yes  |
| DELETE | `/api/meetings/{id}` | Delete meeting           | Yes  |

### Meeting Sub-Resources (all require Auth, scoped to owner)
| Resource     | GET                                    | POST | PUT/DELETE                         |
|-------------|----------------------------------------|------|------------------------------------|
| Transcript  | `/api/meetings/{id}/transcript`        | ✓    | —                                  |
| Summary     | `/api/meetings/{id}/summary`           | ✓    | —                                  |
| Action Items| `/api/meetings/{id}/action-items`      | ✓    | PUT/DELETE `…/action-items/{aid}`   |
| Chapters    | `/api/meetings/{id}/chapters`          | ✓    | PUT `…/chapters/{cid}`             |
| Highlights  | `/api/meetings/{id}/highlights`        | ✓    | DELETE `…/highlights/{hid}`        |
| Comments    | `/api/meetings/{id}/comments`          | ✓    | DELETE `…/comments/{cid}`          |
| Tags        | `/api/meetings/{id}/tags`              | ✓    | DELETE `…/tags/{tag_id}`           |

### Other
| Method | Path          | Description                               | Auth |
|--------|---------------|-------------------------------------------|------|
| GET    | `/api/health` | Service liveness                          | No   |
| GET    | `/api/tags`   | List all tags                             | Yes  |
| POST   | `/api/tags`   | Create tag                                | Yes  |
| GET    | `/api/search` | Global search (meetings + transcripts)    | Yes  |

See [`docs/API_DESIGN.md`](./docs/API_DESIGN.md) for full endpoint documentation.

---

## Local Setup Instructions

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **Python** 3.11+
- **git**

### 1. Clone the repository
```bash
git clone <repo-url>
cd firefiles
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create your local .env (copy from template)
cp .env.example .env
# Edit .env: set SEED_USER_EMAIL and SEED_USER_PASSWORD for development seed data

# Seed the database (optional — creates 6 sample meetings)
python -m app.utils.seed

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create your local .env.local (copy from template)
cp .env.example .env.local

# Start the development server
npm run dev
```

### 4. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/health
- **Swagger Docs:** http://localhost:8000/docs

Register an account at `/register`, then sign in at `/login`.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable              | Default                  | Description                     |
|-----------------------|--------------------------|---------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000`  | Base URL for backend API calls  |

### Backend (`backend/.env`)

| Variable              | Default                         | Description                                        |
|-----------------------|---------------------------------|----------------------------------------------------|
| `DATABASE_URL`        | `sqlite:///./firefiles.db`      | SQLAlchemy database connection URL                 |
| `ENVIRONMENT`         | `development`                   | `development` or `production`                      |
| `CORS_ORIGINS`        | `["http://localhost:3000"]`     | JSON array of allowed CORS origins                 |
| `JWT_SECRET`          | dev-only fallback               | **Must be ≥32 chars in production**                |
| `JWT_EXPIRE_MINUTES`  | `10080` (7 days)                | Access token lifetime in minutes                   |
| `SEED_USER_EMAIL`     | *(unset)*                       | Email for development seed user; **not in prod**   |
| `SEED_USER_PASSWORD`  | *(unset)*                       | Password for development seed user; **not in prod**|

> **Security:** Never commit `.env` files. Never use the dev JWT fallback in production. The backend validates these rules when `ENVIRONMENT=production` and will refuse to start if they are violated.

> **Legacy SQLite upgrade:** If an older local database has meetings without an owner, startup preserves and quarantines them under a non-loginable legacy archive account before enforcing the required ownership constraint. No arbitrary user receives access to those records.

---

## Development Commands

### Frontend
```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build
npm run start    # Start production server (after build)
npm run lint     # ESLint check
```

### Backend
```bash
# Activate virtual environment first
uvicorn app.main:app --reload          # Dev server with auto-reload
uvicorn app.main:app --host 0.0.0.0   # Listen on all interfaces
python -m app.utils.seed               # Seed development data
```

---

## Testing Instructions

### Backend Test Suite
```bash
cd backend
source venv/bin/activate   # Windows: venv\Scripts\activate
pytest tests/ -v
```

Expected result: **14 tests passed** covering:
- Health endpoint
- Meeting CRUD (create, read, update, delete)
- Tag creation
- 404 handling
- Transcript, summary, action item, chapter CRUD
- Validation errors
- Authentication and meeting ownership isolation (cross-user 404, unauthenticated 401, `/api/auth/me`, invalid token)
- Comment CRUD and validation

### Frontend Verification
```bash
cd frontend
npm run lint     # Must pass with no errors
npm run build    # Must complete successfully
```

---

## Deployment Instructions

### Backend (Render / Railway / Fly.io)

1. Create a new **Web Service** on your chosen platform
2. Set the root directory to `backend/`
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure environment variables:
   - `DATABASE_URL=sqlite:///./firefiles.db`
   - `ENVIRONMENT=production`
   - `CORS_ORIGINS=["https://your-frontend-url.vercel.app"]`
   - `JWT_SECRET=<generate-a-strong-random-secret-at-least-32-chars>`
   - Do **not** set `SEED_USER_EMAIL` or `SEED_USER_PASSWORD` in production
6. For seed data in staging, set `ENVIRONMENT=development` and provide seed credentials temporarily

### Frontend (Vercel / Netlify)

1. Create a new project pointing to the repository
2. Set the root directory to `frontend/`
3. Set the build command: `npm run build`
4. Set the output directory: `.next`
5. Configure environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com`
6. Deploy

### Important Notes
- The backend uses SQLite; on platforms with ephemeral filesystems (Render free tier), the database resets on each deploy. For persistent data, use a PostgreSQL database and update `DATABASE_URL`.
- Ensure the backend `CORS_ORIGINS` includes the deployed frontend URL.
- Ensure the frontend `NEXT_PUBLIC_API_URL` points to the deployed backend URL.

---

## Assumptions

1. **No real audio transcription** — Real speech-to-text/audio transcription is out of scope per the assignment. Transcript data is seeded/uploaded via the API. The media player uses a simulated clock when no real audio file is provided.
2. **No real LLM integration** — Summaries are seeded mock data. The "AI Summary" section demonstrates the UI pattern but does not call an actual LLM.
3. **SQLite for persistence** — Suitable for development and demonstration. The application uses SQLAlchemy, making migration to PostgreSQL a configuration change.
4. **Single-user ownership model** — Meetings belong to one owner. There is no sharing or team collaboration model beyond comments.
5. **No email verification** — Registration does not verify email addresses.
6. **Token-based auth only** — JWT is stored in localStorage for this assignment; server-side revocation protects logout, but a production system should prefer HTTP-only cookies and refresh-token rotation.

---

## Mocked / Placeholder Functionality

| Feature              | Status                                                                    |
|----------------------|---------------------------------------------------------------------------|
| Audio transcription  | **Mocked** — transcript data is seeded; no real STT service               |
| AI summaries         | **Mocked** — summaries are seeded strings; no LLM API call               |
| Audio playback       | **Simulated** — player uses a browser clock fallback when no `audio_url` is present; real HTML5 audio works when a URL is provided |
| Calendar integration | **Not implemented** — out of scope                                        |
| PDF/Markdown export  | **Not implemented** — listed as future work                               |
| Real-time collaboration | **Not implemented** — no WebSocket support                             |

---

## Known Limitations

1. **Ephemeral SQLite** — On cloud platforms with ephemeral filesystems, the database resets on each deploy. Use PostgreSQL for persistent production deployments.
2. **No file upload** — Audio files are referenced by URL; there is no file upload endpoint.
3. **No pagination on sub-resources** — Transcript segments, action items, chapters, comments, and highlights return all records for a meeting (acceptable for typical meeting sizes).
4. **JWT in localStorage** — Suitable for this assignment but should use HTTP-only cookies for production security hardening.
5. **No rate limiting** — The API does not implement rate limiting.
6. **InsecureKeyLengthWarning in tests** — The dev-only JWT fallback is shorter than 32 bytes; this is expected and enforced to be different in production.
7. **System font stack** — Uses OS system fonts instead of Google Fonts to avoid network dependencies during builds (see `DECISIONS.md` ADR-008).

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System design, request flow, environment variables |
| [`docs/API_DESIGN.md`](./docs/API_DESIGN.md) | All REST endpoints with implementation status |
| [`docs/DATABASE_DESIGN.md`](./docs/DATABASE_DESIGN.md) | Entity schema and relationships |
| [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) | Setup guide, scripts, troubleshooting |
| [`DECISIONS.md`](./DECISIONS.md) | Architecture Decision Records (ADRs) |
| [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) | Milestone tracking and current status |
Authentication uses short-lived bearer JWTs stored by the frontend for this assignment. Each token has a unique ID; `POST /api/auth/logout` persists its revocation until expiry, so a logged-out token immediately receives `401`. The frontend always clears local state on logout or a `401`. JWT secrets are backend-only and production startup requires a strong configured secret.
