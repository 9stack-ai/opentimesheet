#!/bin/sh
set -e

echo "[entrypoint] Provisioning PostgreSQL schema (prisma db push)…"
n=0
until pnpm exec prisma db push --schema=prisma/schema.prod.prisma --skip-generate; do
  n=$((n + 1))
  if [ "$n" -ge 10 ]; then
    echo "[entrypoint] db push failed after $n attempts" >&2
    exit 1
  fi
  echo "[entrypoint] database not ready, retry $n…"
  sleep 3
done

echo "[entrypoint] Bootstrapping admin account (if configured)…"
pnpm exec tsx scripts/bootstrap-admin.ts || echo "[entrypoint] admin bootstrap reported a non-fatal error"

echo "[entrypoint] Starting: $*"
exec "$@"
