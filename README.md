# Ledger — Task Management

A full-stack task management app with a Go REST API, Next.js frontend, and PostgreSQL persistence. Built for the Rival.io developer assessment.

## Live demo

Deploy to Vercel with a hosted PostgreSQL (Neon, Supabase, or Vercel Postgres). See [Deployment](#deployment) below.

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend  | Go 1.22, chi router, JWT auth       |
| Database | PostgreSQL                          |
| Deploy   | Vercel (Next.js + Go serverless)    |

## Features

- **Tasks CRUD** — create, read, update, delete with validation
- **Auth** — signup/login with bcrypt-hashed passwords and JWT; persisted in localStorage
- **Filtering** — status filter, title search, sort by due date / priority / created date
- **Pagination** — server-side page/limit
- **User isolation** — users only see their own tasks
- **Bonus** — dark mode toggle (persisted), optimistic UI on complete/delete, Docker Compose for local API+DB, GitHub Actions CI

## API endpoints

| Method | Path            | Auth | Description              |
|--------|-----------------|------|--------------------------|
| POST   | `/api/auth/signup` | —  | Register                 |
| POST   | `/api/auth/login`  | —  | Login, returns JWT       |
| GET    | `/api/health`      | —  | Health check             |
| POST   | `/api/tasks`       | ✓  | Create task              |
| GET    | `/api/tasks`       | ✓  | List (filter, search, sort, paginate) |
| GET    | `/api/tasks/:id`   | ✓  | Get one task             |
| PATCH  | `/api/tasks/:id`   | ✓  | Update task              |
| DELETE | `/api/tasks/:id`   | ✓  | Delete task              |

Query params for `GET /api/tasks`:

- `status` — `todo`, `in_progress`, `complete`
- `search` — case-insensitive title match
- `sort_by` — `due_date`, `priority`, `created_at`
- `sort_order` — `asc` or `desc`
- `page`, `limit` — pagination (default page=1, limit=10)

## Local development

### Prerequisites

- Node.js 20+
- Go 1.22+
- PostgreSQL 14+ (or Docker)

### 1. Database

**Option A — Docker Compose (API + DB)**

```bash
docker compose up -d
```

**Option B — existing Postgres**

```bash
createdb taskmanager
```

### 2. Environment

```bash
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
```

### 3. Run the API

```bash
cd api && go mod tidy && cd ..
export $(grep -v '^#' .env | xargs)
go run ./cmd/server
```

API listens on `http://localhost:8080`.

### 4. Run the frontend

In a second terminal:

```bash
npm install
# Point Next.js rewrites at the local Go server
export API_URL=http://localhost:8080
npm run dev
```

Open `http://localhost:3000`.

**Shortcut** — one command (detects Docker API if already running):

```bash
npm run dev
```

## Deployment (Vercel)

Frontend and backend deploy together on one Vercel project. The Go API runs as a serverless function; Next.js serves the UI.

### Step-by-step

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Task management app — Go API, Next.js, PostgreSQL"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create PostgreSQL** (pick one)
   - [Neon](https://neon.tech) — free tier, copy the connection string
   - [Supabase](https://supabase.com) → Project Settings → Database → connection string
   - [Vercel Postgres](https://vercel.com/storage/postgres) — integrates directly in the Vercel dashboard

   Use the **pooled** connection string if available (better for serverless).

3. **Import project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new) → Import your GitHub repo
   - Framework: **Next.js** (auto-detected)
   - Root directory: `.` (default)
   - Do **not** set `API_URL` in production

4. **Set environment variables** (Vercel → Project → Settings → Environment Variables)

   | Variable       | Value                                      | Environments   |
   |----------------|--------------------------------------------|----------------|
   | `DATABASE_URL` | `postgres://...` from step 2               | Production, Preview |
   | `JWT_SECRET`   | Long random string (`openssl rand -hex 32`) | Production, Preview |

5. **Deploy** — click Deploy. Vercel will:
   - Build Next.js (`npm run build`)
   - Deploy Go handler from `api/index.go` at `/api/*` (via `vercel.json`)

6. **Verify**
   - `https://<your-app>.vercel.app` → frontend
   - `https://<your-app>.vercel.app/api/health` → `{"status":"ok"}`
   - Sign up, create a task, refresh — auth and tasks should persist

### Submission email

Send to **sabir@rival.io**:

- GitHub repo URL (public, or grant access)
- Live URL: `https://<your-app>.vercel.app` (frontend + API on same domain)

## Assessment deliverables checklist

| Requirement | Status | Location |
|-------------|--------|----------|
| REST API (CRUD + validation) | Done | `api/` |
| PostgreSQL persistence | Done | `api/db.go` |
| JWT auth + password hashing | Done | `api/auth.go` |
| User-scoped tasks | Done | `api/tasks.go` |
| Next.js frontend | Done | `src/` |
| Status filter + pagination | Done | `/tasks` page |
| Create/edit form + validation | Done | `TaskForm` component |
| Search + sort (combined with filters) | Done | `/tasks` page |
| Loading / empty / error states | Done | `/tasks` page |
| Responsive layout | Done | mobile filter pills + desktop rail |
| README with setup instructions | Done | `README.md` |
| `.env.example` | Done | `.env.example` |
| ≥ 3 meaningful tests | Done | 7 Go + 5 frontend tests |
| Clean commit history | **You** | commit logically before submitting |
| **Bonus:** Docker Compose | Done | `docker-compose.yml` |
| **Bonus:** CI pipeline | Done | `.github/workflows/ci.yml` |
| **Bonus:** Dark mode | Done | theme toggle in sidebar |
| **Bonus:** Optimistic UI | Done | complete/delete rollback |
| **Bonus:** Admin role (API) | Done | `role = 'admin'` in DB |
| Deployed live link | **You** | follow steps above |

### Assumptions & trade-offs

- **Vercel + Go**: A single serverless handler routes all `/api/*` requests. Cold starts add latency on first request; connection pooling uses pgx pool per instance.
- **Auth**: JWT in localStorage (not httpOnly cookies) for simplicity; refresh on page load via stored token.
- **Admin role**: Schema supports `admin` role for viewing all tasks, but no UI to promote users — set `role = 'admin'` manually in DB if needed.
- **Migrations**: Schema is applied via `CREATE TABLE IF NOT EXISTS` on first API request — fine for assessment scope; use a migration tool for production.

## Tests

```bash
# Backend (7 tests)
cd api && go test ./... -v

# Frontend (4 tests)
npm test
```

## Project structure

```
├── api/              # Vercel entry point only (index.go)
├── pkg/core/    # Go REST API logic
├── cmd/server/       # Standalone API server for local dev
├── src/              # Next.js app
├── vercel.json       # Routes /api/* to Go handler
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## License

MIT
