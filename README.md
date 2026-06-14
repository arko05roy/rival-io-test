# Ledger — Task Management

Full-stack task management app with a Go REST API, Next.js frontend, and PostgreSQL. Built for the Rival.io developer assessment.

## Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend  | Go 1.22, chi router, JWT auth      |
| Database | PostgreSQL                         |
| Deploy   | Vercel (Next.js + Go serverless)   |

## Features

- **Tasks CRUD** — create, read, update, delete with server-side validation
- **Auth** — signup/login with bcrypt-hashed passwords and JWT
- **Filtering** — status filter, title search, sort by due date / priority / created date
- **Pagination** — server-side page/limit
- **User isolation** — users only see their own tasks
- **Dark mode** — toggle persisted in localStorage
- **Optimistic UI** — complete and delete update the list immediately, with rollback on failure
- **Delete confirmation** — modal dialog instead of a browser alert
- **Date picker** — custom calendar for due dates, timezone-safe display
- **Docker Compose** — local Postgres + API
- **CI** — GitHub Actions runs Go and frontend tests on push

## Assumptions & trade-offs

**Auth**

- JWT is stored in `localStorage` and sent as a `Bearer` token. This keeps the frontend simple but is more exposed to XSS than httpOnly cookies. A production app would likely use short-lived access tokens with refresh cookies.

**Deployment**

- On Vercel, all `/api/*` traffic goes through a single Go serverless handler (`api/index.go`). Cold starts add latency on the first request after idle time. Each instance maintains its own pgx connection pool — use a pooled connection string (Neon, Supabase, Vercel Postgres) in production.

**Database**

- Schema is applied via `CREATE TABLE IF NOT EXISTS` on the first API request. Fine for this scope; a migration tool (e.g. goose, golang-migrate) would be needed for evolving production schemas.

**Due dates**

- Stored as `TIMESTAMPTZ` in Postgres, but the frontend treats them as calendar dates (`YYYY-MM-DD`) to avoid timezone shifts when picking, editing, or displaying a date. The API accepts ISO 8601 or `YYYY-MM-DD` strings.

**Admin role**

- The `users` table has a `role` column (`user` / `admin`). Admins can list all tasks via the API, but there is no UI to promote users — set `role = 'admin'` manually in the database if needed.

**Search**

- Title search is debounced on the client (300 ms) then sent to the server. Very fast typists may see a brief delay before results update.

**Testing**

- Tests cover validation, auth helpers, date/urgency logic, and password hashing. There are no end-to-end or integration tests against a live database.

## Local development

### Prerequisites

- Node.js 20+
- Go 1.22+
- PostgreSQL 14+ (or Docker)

### Quick start

```bash
# 1. Start Postgres + API (optional — dev script can start the API for you)
docker compose up -d

# 2. Environment
cp .env.example .env

# 3. Install and run (starts Go API if not already up, then Next.js)
npm install
npm run dev
```

Open `http://localhost:3000`. The dev script proxies `/api/*` to `http://localhost:8080`.

### Run services separately

**API only**

```bash
export $(grep -v '^#' .env | xargs)
go run ./cmd/server
```

**Frontend only** (with API already running)

```bash
export API_URL=http://localhost:8080
npm run dev:web
```

### Environment variables

| Variable       | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string                     |
| `JWT_SECRET`   | Yes      | Secret for signing JWTs                          |
| `API_URL`      | Local    | Go API base URL for Next.js rewrites (not needed on Vercel) |
| `API_PORT`     | No       | Go API port locally (default `8080`)             |

## Deployment (Vercel)

Frontend and API deploy as one Vercel project. Next.js serves the UI; the Go handler in `api/index.go` serves `/api/*`.

1. Push the repo to GitHub.
2. Create a PostgreSQL database (Neon, Supabase, or Vercel Postgres). Use the **pooled** connection string.
3. Import the project at [vercel.com/new](https://vercel.com/new). Framework: Next.js.
4. Set environment variables for Production and Preview:

   | Variable       | Value                                |
   |----------------|--------------------------------------|
   | `DATABASE_URL` | `postgres://...` from your provider  |
   | `JWT_SECRET`   | Long random string                   |

   Do **not** set `API_URL` in production — the API is on the same domain.

5. Deploy and verify:
   - `https://<your-app>.vercel.app` — frontend
   - `https://<your-app>.vercel.app/api/health` — `{"status":"ok"}`

### Submission

Send to **sabir@rival.io**:

- GitHub repo URL (public, or grant access)
- Live URL: `https://<your-app>.vercel.app`

## API

| Method | Path               | Auth | Description                           |
|--------|--------------------|------|---------------------------------------|
| POST   | `/api/auth/signup` | —    | Register                              |
| POST   | `/api/auth/login`  | —    | Login, returns JWT                    |
| GET    | `/api/health`      | —    | Health check                          |
| POST   | `/api/tasks`       | ✓    | Create task                           |
| GET    | `/api/tasks`       | ✓    | List (filter, search, sort, paginate) |
| GET    | `/api/tasks/:id`   | ✓    | Get one task                          |
| PATCH  | `/api/tasks/:id`   | ✓    | Update task                           |
| DELETE | `/api/tasks/:id`   | ✓    | Delete task                           |

**Query params for `GET /api/tasks`**

| Param        | Values                                      | Default   |
|--------------|---------------------------------------------|-----------|
| `status`     | `todo`, `in_progress`, `complete`           | all       |
| `search`     | case-insensitive title match                | —         |
| `sort_by`    | `due_date`, `priority`, `created_at`        | `created_at` |
| `sort_order` | `asc`, `desc`                               | `desc`    |
| `page`       | positive integer                            | `1`       |
| `limit`      | positive integer                            | `10`      |

## Tests

```bash
# Backend (7 tests)
go test ./pkg/core/... -v

# Frontend (11 tests)
npm test
```

## Project structure

```
├── api/                  # Vercel serverless entry point
├── pkg/core/             # Go API — routes, auth, tasks, validation
├── cmd/server/           # Standalone API server for local dev
├── src/                  # Next.js app
│   ├── app/              # Pages (login, signup, tasks)
│   ├── components/       # UI components
│   └── lib/              # API client, auth, date/urgency helpers
├── scripts/dev.sh        # Local dev orchestration
├── docker-compose.yml    # Postgres + API containers
├── vercel.json           # Rewrites /api/* to Go handler
└── .github/workflows/    # CI pipeline
```

## License

MIT
