# Deployment Guide — 9stimesheet

Production: **https://timesheet.9stack.vn** on server `9stack-prod` (194.163.170.168, Ubuntu 24.04).

## Architecture

Single-host Docker Compose. Source lives in `/opt/9stimesheet` on the server.

| Service | Image | Role |
|---------|-------|------|
| `caddy` | caddy:2 | Reverse proxy, automatic Let's Encrypt TLS (ports 80/443) |
| `app`   | built from `Dockerfile` | Next.js (`next start`, port 3000, internal) |
| `db`    | postgres:17 | PostgreSQL (port 5432, **internal only — not published**) |

- **Dev uses SQLite, prod uses PostgreSQL.** `lib/db.ts` selects the adapter from the `DATABASE_URL` scheme (`file:` → SQLite, `postgres://` → pg). Prod models live in `prisma/schema.prod.prisma` (keep in sync with `prisma/schema.prisma`).
- Schema is provisioned with `prisma db push` on every container start (`docker-entrypoint.sh`); the first admin is created once by `scripts/bootstrap-admin.ts` from env vars.

## Secrets — `/opt/9stimesheet/.env` (chmod 600, never committed)

`POSTGRES_USER/PASSWORD/DB`, `DATABASE_URL` (→ `db` service), `AUTH_SECRET`, `AUTH_URL=https://timesheet.9stack.vn`, `ADMIN_EMAIL/NAME/PASSWORD`, and (for Redmine) `REDMINE_URL`, `REDMINE_ENC_KEY` (`openssl rand -base64 32`), optional `REDMINE_DEFAULT_ACTIVITY_ID`. Template: `.env.production.example`.

## Deploy / redeploy

From the project root on a dev machine (SSH host alias `9stack-prod` must be configured):

```bash
git archive --format=tar HEAD | ssh 9stack-prod 'tar -x -C /opt/9stimesheet'
scp pnpm-lock.yaml 9stack-prod:/opt/9stimesheet/   # lockfile is git-ignored globally; ship it explicitly
ssh 9stack-prod 'cd /opt/9stimesheet && docker compose up -d --build'
```

`db-data` (Postgres) and `caddy-data` (TLS certs) are named volumes and survive rebuilds. The admin is never overwritten on redeploy.

## Operations

```bash
ssh 9stack-prod 'cd /opt/9stimesheet && docker compose ps'             # status
ssh 9stack-prod 'cd /opt/9stimesheet && docker compose logs -f app'    # app logs
ssh 9stack-prod 'cd /opt/9stimesheet && docker compose restart app'    # restart app

# Postgres backup
ssh 9stack-prod 'cd /opt/9stimesheet && docker compose exec -T db pg_dump -U 9stimesheet 9stimesheet' > backup-$(date +%F).sql
```

## Security

- Firewall (`ufw`) allows only 22/80/443. PostgreSQL is reachable only on the internal compose network.
- Production never uses the dev seed password (`password123`); the admin password is generated at deploy time.
- After first login, change the admin password and rotate `ADMIN_PASSWORD` out of `.env`.

## Redmine integration

Single shared company Redmine. Set `REDMINE_URL` (admin) and `REDMINE_ENC_KEY` (`openssl rand -base64 32`; encrypts each user's API key at rest) in `.env`. Each user connects their own API key at **Kết nối Redmine** (`/settings/redmine`); managers map an app Project to a Redmine project id on the project page; users press **Đồng bộ Redmine** on the timesheet to pull their assigned issues as Tasks. Approved time is pushed back to the issue automatically (best-effort, idempotent). Optional `REDMINE_DEFAULT_ACTIVITY_ID` sets the time-entry activity when the instance has no default. Without `REDMINE_URL` the feature is dormant (no impact elsewhere). The new columns are additive/nullable — `prisma db push` applies them on the next deploy.

## Known constraints

- `prisma db push` (not migrations) provisions prod. For a fresh DB this is safe; destructive model changes need manual review before redeploy.
- `prisma/schema.prod.prisma` must be updated alongside `prisma/schema.prisma` whenever the data model changes.
