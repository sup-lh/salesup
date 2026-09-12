#!/usr/bin/env bash
set -euo pipefail
exec npx concurrently -n api,web -c blue,green "npm run dev:server" "npm run dev:client"
