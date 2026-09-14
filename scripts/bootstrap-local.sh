#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose --env-file .env.docker -f infra/docker-compose.yml)

command -v docker >/dev/null || { echo "Docker is required. Install Docker Desktop first." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker Desktop is not running. Start it and retry." >&2; exit 1; }

if [[ ! -f .env.docker ]]; then
  cp .env.docker.example .env.docker
  echo "Created .env.docker from .env.docker.example"
fi

# Values are read by this script only; the API container receives them explicitly below.
set -a
# shellcheck disable=SC1091
source .env.docker
set +a

: "${ADMIN_USERNAME:=admin}"
: "${ADMIN_PASSWORD:=SalesUp-Admin-2026!}"
: "${ADMIN_DISPLAY_NAME:=系统管理员}"
: "${DEMO_PASSWORD:=Demo-SalesUp-2026!}"

echo "Starting local development environment..."
"${COMPOSE[@]}" up -d --build

echo "Waiting for API health check..."
for attempt in {1..30}; do
  if "${COMPOSE[@]}" exec -T api wget -qO- http://127.0.0.1:3000/api/health/ready >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    echo "API did not become ready. Inspect logs with: ${COMPOSE[*]} logs api" >&2
    exit 1
  fi
  sleep 2
done

echo "Creating local administrator (existing account is preserved)..."
"${COMPOSE[@]}" exec -T \
  -e ADMIN_USERNAME="$ADMIN_USERNAME" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e ADMIN_DISPLAY_NAME="$ADMIN_DISPLAY_NAME" \
  -e ADMIN_CREATE_ONLY=true \
  api node server/database/migrations/create-admin.mjs

echo "Seeding demo data (safe to run repeatedly)..."
"${COMPOSE[@]}" exec -T -e DEMO_PASSWORD="$DEMO_PASSWORD" api node server/database/migrations/seed-demo.mjs

cat <<EOF

SalesUp is ready: http://localhost:${WEB_PORT:-8080}
Admin: ${ADMIN_USERNAME}
Demo password: ${DEMO_PASSWORD}

Useful commands:
  npm run docker:ps
  npm run docker:down
  ${COMPOSE[*]} logs -f api
EOF
