#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
backup="${1:-}"
if [[ -z "$backup" || ! -f "$backup" ]]; then
  echo "Usage: DATABASE_URL=... $0 /explicit/path/backup.dump" >&2
  exit 1
fi
case "$backup" in
  /|.) echo "Refusing to restore from an unsafe target" >&2; exit 1;;
esac
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" "$backup"
echo "Restored $backup"
