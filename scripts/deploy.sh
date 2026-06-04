#!/usr/bin/env bash
#
# FIP — one-shot Cloudflare deploy (Worker + D1 + R2). Idempotent: safe to re-run.
#
# Usage (from anywhere; the script finds the repo root):
#   export CLOUDFLARE_API_TOKEN=xxxxxxxx
#   export CLOUDFLARE_ACCOUNT_ID=xxxxxxxx
#   bash scripts/deploy.sh
#
# The API token needs these account permissions:
#   Workers Scripts:Edit · D1:Edit · Workers R2 Storage:Edit · Account Settings:Read
# (the "Edit Cloudflare Workers" template + D1:Edit covers it).
#
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (Cloudflare API token)}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID (Cloudflare account id)}"
export WRANGLER_SEND_METRICS=false CI=1

DB_NAME=fip-db
R2_NAME=fip-assets

# --- Run from the repo root (where wrangler.toml lives) ---
if [ ! -f wrangler.toml ]; then
  cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
fi
[ -f wrangler.toml ] || { echo "ERROR: run from the FIP repo root (wrangler.toml not found)" >&2; exit 1; }

step() { printf '\n\033[1;35m==>\033[0m %s\n' "$1"; }

step "Installing dependencies (incl. devDependencies)"
npm ci --include=dev

step "Verifying Cloudflare auth"
npx wrangler whoami

step "Ensuring D1 database '$DB_NAME' exists"
npx wrangler d1 create "$DB_NAME" 2>/dev/null || echo "    (already exists)"

step "Resolving D1 database id"
DB_ID="$(npx wrangler d1 list --json \
  | node -e "let s='';process.stdin.on('data',c=>s+=c).on('end',()=>{const a=JSON.parse(s||'[]');const r=a.find(x=>x.name===process.argv[1]);console.log(r?r.uuid:'')})" "$DB_NAME")"
[ -n "$DB_ID" ] || { echo "ERROR: could not resolve id for $DB_NAME" >&2; exit 1; }
echo "    $DB_NAME = $DB_ID"

step "Writing database_id into wrangler.toml"
sed -i.bak -E "s|^database_id = \".*\"|database_id = \"$DB_ID\"|" wrangler.toml && rm -f wrangler.toml.bak
echo "    (the database_id is not a secret — feel free to commit wrangler.toml)"

step "Ensuring R2 bucket '$R2_NAME' exists"
npx wrangler r2 bucket create "$R2_NAME" 2>/dev/null || echo "    (already exists)"

step "Applying schema (remote D1)"
npm run db:migrate:remote

step "Seeding (remote D1) — refreshes demo content, preserves accounts"
npm run db:seed:remote

step "Building + deploying the Worker"
DEPLOY_LOG="$(npm run deploy 2>&1)"
echo "$DEPLOY_LOG"
URL="$(printf '%s\n' "$DEPLOY_LOG" | grep -oE 'https://[A-Za-z0-9.-]+\.workers\.dev' | head -n1 || true)"

if [ -n "$URL" ]; then
  step "Verifying API at $URL"
  ME="$(curl -s -o /dev/null -w '%{http_code}' "$URL/api/auth/me" || true)"
  LOGIN="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL/api/auth/login" \
    -H 'content-type: application/json' -d '{"username":"demo","password":"demo1234"}' || true)"
  echo "    GET  /api/auth/me           -> $ME    (expect 401)"
  echo "    POST /api/auth/login (demo) -> $LOGIN (expect 200)"
  if [ "$ME" = "401" ] && [ "$LOGIN" = "200" ]; then
    printf '\n\033[1;32m✅ Deployed & verified.\033[0m Open %s and log in with demo / demo1234\n' "$URL"
  else
    printf '\n\033[1;33m⚠️  Deployed, but verification was inconclusive — check the output above.\033[0m\n'
  fi
else
  printf '\n\033[1;33m⚠️  Deployed, but could not auto-detect the workers.dev URL.\033[0m\n'
  echo "    If this is the account's first Worker, register a workers.dev subdomain in the dashboard, then re-run."
fi
