#!/usr/bin/env bash
set -euo pipefail

: "${STORAGE_ENDPOINT:?STORAGE_ENDPOINT is required}"
: "${STORAGE_ACCESS_KEY:?STORAGE_ACCESS_KEY is required}"
: "${STORAGE_SECRET_KEY:?STORAGE_SECRET_KEY is required}"
: "${STORAGE_BUCKET:?STORAGE_BUCKET is required}"
backup="${1:-}"
if [[ -z "$backup" || ! -d "$backup" ]]; then
  echo "Usage: RESTORE_CONFIRM=RESTORE_MINIO $0 /explicit/path/bucket-backup" >&2
  exit 1
fi
if [[ "${RESTORE_CONFIRM:-}" != "RESTORE_MINIO" ]]; then
  echo "Set RESTORE_CONFIRM=RESTORE_MINIO to replace the target bucket contents" >&2
  exit 1
fi
case "$backup" in
  /|.|..|./|../) echo "Refusing to restore from an unsafe target" >&2; exit 1;;
esac
command -v mc >/dev/null || { echo "mc (MinIO client) is required" >&2; exit 1; }
mc alias set newcomer-restore "$STORAGE_ENDPOINT" "$STORAGE_ACCESS_KEY" "$STORAGE_SECRET_KEY" >/dev/null
mc mirror --overwrite --remove "$backup" "newcomer-restore/$STORAGE_BUCKET"
echo "Restored $backup to $STORAGE_BUCKET"
