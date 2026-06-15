#!/usr/bin/env sh
set -e

API_PORT="${API_PORT:-8080}"
export API_URL="${API_URL:-http://localhost:${API_PORT}}"
export JWT_SECRET="${JWT_SECRET:-dev-secret-change-me}"

API_PID=""

cleanup() {
  if [ -n "$API_PID" ]; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

api_healthy() {
  curl -sf "${API_URL}/api/health" >/dev/null 2>&1
}

if api_healthy; then
  echo "API already running at ${API_URL} — skipping local Go server"
else
  stale_pid="$(lsof -ti :"${API_PORT}" 2>/dev/null || true)"
  if [ -n "$stale_pid" ]; then
    echo "Stopping stale API on :${API_PORT}"
    kill $stale_pid 2>/dev/null || true
    sleep 0.5
  fi

  echo "Starting Go API on :${API_PORT} (in-memory; set USE_DATABASE=1 for Postgres)"
  if [ "$USE_DATABASE" = "1" ]; then
    export DATABASE_URL="${DATABASE_URL:-postgres://taskuser:taskpass@localhost:5432/taskmanager?sslmode=disable}"
  else
    unset DATABASE_URL
  fi
  PORT="${API_PORT}" go run ./cmd/server &
  API_PID=$!
  sleep 1

  if ! api_healthy; then
    echo "Warning: API did not become healthy at ${API_URL}."
  fi
fi

# PORT must not leak to Next.js — it also reads PORT and would try :8080
unset PORT

echo "Starting Next.js on :3000 (proxying /api/* → ${API_URL})"
exec npx next dev -p 3000
