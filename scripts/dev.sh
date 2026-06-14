#!/usr/bin/env sh
set -e

API_PORT="${API_PORT:-8080}"
export API_URL="${API_URL:-http://localhost:${API_PORT}}"
export DATABASE_URL="${DATABASE_URL:-postgres://taskuser:taskpass@localhost:5432/taskmanager?sslmode=disable}"
export JWT_SECRET="${JWT_SECRET:-dev-secret-change-me}"

API_PID=""

cleanup() {
  if [ -n "$API_PID" ]; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

# Reuse an API that's already running (e.g. docker compose up)
if curl -sf "${API_URL}/api/health" >/dev/null 2>&1; then
  echo "API already running at ${API_URL} — skipping local Go server"
else
  echo "Starting Go API on :${API_PORT} (run 'docker compose up -d' if Postgres isn't up)"
  PORT="${API_PORT}" go run ./cmd/server &
  API_PID=$!
  sleep 1

  if ! curl -sf "${API_URL}/api/health" >/dev/null 2>&1; then
    echo "Warning: API did not become healthy at ${API_URL}. Check DATABASE_URL / Postgres."
  fi
fi

# PORT must not leak to Next.js — it also reads PORT and would try :8080
unset PORT

echo "Starting Next.js on :3000 (proxying /api/* → ${API_URL})"
exec npx next dev -p 3000
