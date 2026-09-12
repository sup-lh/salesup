#!/usr/bin/env bash
set -euo pipefail

: "${STORAGE_ENDPOINT:?STORAGE_ENDPOINT is required}"
: "${STORAGE_ACCESS_KEY:?STORAGE_ACCESS_KEY is required}"
: "${STORAGE_SECRET_KEY:?STORAGE_SECRET_KEY is required}"
: "${STORAGE_BUCKET:?STORAGE_BUCKET is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups/minio}"
case "$BACKUP_DIR" in
  ''|/|.|..|./|../) echo "BACKUP_DIR must be an explicit directory" >&2; exit 1;;
esac
command -v mc >/dev/null || { echo "mc (MinIO client) is required" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
mc alias set newcomer-backup "$STORAGE_ENDPOINT" "$STORAGE_ACCESS_KEY" "$STORAGE_SECRET_KEY" >/dev/null
mc mirror --overwrite "newcomer-backup/$STORAGE_BUCKET" "$BACKUP_DIR/$STORAGE_BUCKET"
echo "Created $BACKUP_DIR/$STORAGE_BUCKET"
