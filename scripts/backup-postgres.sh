#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
case "$BACKUP_DIR" in
  ''|/|.|..|./|../) echo "BACKUP_DIR must be an explicit directory" >&2; exit 1;;
esac
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/newcomer-$timestamp.dump"
pg_dump --format=custom --no-owner --file "$output" "$DATABASE_URL"
echo "Created $output"
