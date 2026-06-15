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
