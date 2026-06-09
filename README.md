# FIP — Real-Time Fashion Voting PWA

Two looks. One tap. **Which look wins?**

FIP shows two fashion looks side by side and asks you to vote A or B. Voting is
fast and tactile — you tap, the split appears, the next poll loads. Every look can
carry tiny crimson affiliate tags pinned to garments; tapping one opens a compact
shoppable HUD. **Anyone can browse, vote, and shop as a guest** (guest votes count);
**a real account is only required to publish** a poll or a profile photo. Creators
publish A/B polls (which expire after 60 minutes) and permanent photos to a
magazine-style profile, and review their live poll results in a stories-style viewer.

The look-and-feel is a quiet, monochrome editorial palette — white surfaces, black
type, gray UI — with crimson reserved for affiliate tags and the active-poll ring.

Built as a single Cloudflare Worker that serves a React PWA **and** a same-origin
JSON API, backed by D1 (SQLite) and R2 (image storage).

---

## Demo credentials

The seed creates two accounts (passwords are hashed through the real PBKDF2 path,
never hardcoded):

| Username | Password     | Notes                                  |
| -------- | ------------ | -------------------------------------- |
| `demo`   | `demo1234`   | Front-row voter, 3 published looks      |
| `studio` | `studio1234` | Creator "Studio Atelier", 3 looks       |

You can also browse anonymously (no login) and register from the auth popup that
appears when you tap **+** (create poll) or **Profile**. That popup has one-tap
"Try a demo account" chips for convenience.

---

## Run it locally (one-time setup, then one command)

**Prerequisites:** Node 18+ (tested on Node 22) and npm.

```bash
npm install   # install dependencies
npm run dev   # one command: builds, creates + seeds the LOCAL D1, then runs both servers
```

Then open **http://localhost:5173**.

`npm run dev` is self-contained — it runs `setup:local` (generate icons, build the
app, create and seed the local D1) and then starts Vite (`:5173`) and the Worker
(`:8787`) together. The seed is idempotent, so restarting is safe and fast.

- The frontend runs under Vite with HMR on `:5173`.
- The Worker runs under `wrangler dev` on `:8787`; Vite proxies `/api/*` to it, so
  the session cookie stays same-origin (no CORS).
- Data and sessions persist across reloads in the local D1 file under `.wrangler/`.

> Already ran `setup:local` once? Just `npm run dev`. The seed is idempotent
> (deterministic ids; accounts preserved, demo looks/polls refreshed), so
> re-running setup is safe.

Prefer the production-like single-origin experience? After `npm run setup:local`,
run `npm run dev:worker` alone and open **http://localhost:8787** — the Worker serves
the built app and the API on one origin (no HMR).

---

## Architecture choices (one line each)

- **One Worker for app + API.** Static assets (`web/dist`) are served via Workers
  Assets with `run_worker_first = true`; the Worker handles `/api/*` and delegates
  everything else to `env.ASSETS` with SPA fallback — so the cookie is same-origin.
- **PBKDF2 via Web Crypto**, not bcrypt — `crypto.subtle` runs natively in Workers,
  and the seed script reuses the exact same hashing module (no hash drift).
- **Opaque session tokens**, not JWT — the raw token is an httpOnly cookie; only its
  SHA-256 hash is stored in D1, so logout is a single revocable row delete.
- **Identity is always derived from the session**, never from a request body.
- **Guest-first.** Visitors without an account get an auto-provisioned anonymous
  "guest" session (a `users` row with `is_guest = 1`) so their votes/clicks count and
  dedupe per device; publishing requires a real account, and registering **upgrades the
  guest row in place** so their votes carry over.
- **Polls expire after 60 minutes** (`expires_at`); the queue filters them out and a
  lazy GC deletes expired polls. Seeded demo polls never expire.
- **Affiliate links show a "verified" check** when the host is a known affiliate
  program (computed server-side on save).
- **D1 schema is versioned with Cloudflare D1 migrations** (`worker/src/db/migrations`)
  so existing databases upgrade with `ALTER`s rather than a destructive reset.
- **Money is integer cents** in D1; all formatting happens in the client.
- **Server-authoritative vote counts** with optimistic client updates; percentages
  are computed server-side and forced to sum to 100 (0/0 → 0%/0%, never `NaN`).
- **Images:** uploads go to R2 and are streamed back through `GET /api/assets/<key>`
  (same-origin, no public-bucket config required). Publishing is **upload-only**
  (camera or gallery) — no URL paste. Seed imagery uses curated Unsplash editorial
  fashion photos so the app looks populated on first boot.
- **Navigation:** bottom tabs **Poll · (＋) · Profile**. The raised center ＋ opens the
  two-sided poll composer (camera/gallery per side, red item-tag dots + a fill-in popup
  with the verified check, then a caption popup). The Profile ＋ publishes a permanent
  photo. A search overlay finds other creators and opens their (read-only) profile,
  where visitors can vote on the creator's active polls (stories-style).
- **Vite config lives at the repo root** (with `root: ./web`) so a bare `vite` /
  `vite build` from the repo root resolves it.

---

## Project structure

```
/web                      React + TS + Tailwind PWA
  index.html
  /public                 manifest.webmanifest, sw.js, offline.html, icons/
  /scripts/gen-icons.mjs  dependency-free PNG icon generator
  /src
    /api                  typed fetch client + DTOs (client.ts, types.ts)
    /auth                 AuthContext, useAuth, AuthModal (login/signup popup)
    /components           DeviceFrame, Input, Button, TabBar, TagDot, ShopPopup, Avatar, …
    /features
      /feed               usePollQueue, useVote, VoteCanvas, SideCanvas, FeedScreen
      /poll-composer      PollComposer (two-sided camera/gallery + tag popup)
      /profile            useProfile, LookCard, ProfileScreen, PhotoComposer, PollStoriesViewer
      /search             useUserSearch, SearchScreen
    /lib                  format, prefetch, haptics, affiliate, cn
    /styles               Tailwind entry
    App.tsx  main.tsx
/worker                   Cloudflare Worker (TS)
  /src
    index.ts              router: static assets + /api (public / guest / real-account tiers)
    /auth                 password (PBKDF2), session, cookies, guest, requireAuth
    /routes               auth, polls, votes, users, looks, uploads, clicks, assets
    /db                   migrations/, ids, seed.data.ts, seed.ts (PBKDF2 hashing)
    /lib                  json, validate, encoding, percent, affiliate-brands
wrangler.toml
runbook.md                step-by-step Cloudflare deploy (D1 + R2 + Worker)
```

---

## API contract

All JSON, same-origin. Tiers: **—** public · **G** guest-allowed (an anonymous guest
session is auto-provisioned) · **🔒** real account required. Identity is always derived
from the session, never the request body.

| Method | Path                       | Tier | Notes                                                   |
| ------ | -------------------------- | ---- | ------------------------------------------------------- |
| POST   | `/api/auth/register`       | —    | `{username,password,display_name?}` → 201; upgrades a guest in place |
| POST   | `/api/auth/login`          | —    | `{username,password}` → 200; generic 401 on failure     |
| POST   | `/api/auth/logout`         | —    | revokes session + clears cookie                         |
| GET    | `/api/auth/me`             | —    | returns the current actor (guest or real); provisions a guest |
| GET    | `/api/polls/queue?limit=10`| G    | active, non-expired polls **with tags**, excluding ones you voted |
| POST   | `/api/polls/:id/vote`      | G    | `{side}`; atomic + idempotent per actor; 410 if expired |
| POST   | `/api/polls`               | 🔒   | create an A/B poll (+ tags, caption); expires in 60 min |
| GET    | `/api/users?q=<query>`     | G    | search real users → `{users:[…]}`                        |
| GET    | `/api/users/:username`     | G    | `{user, is_owner, looks:[…], polls:[…active…]}`          |
| POST   | `/api/looks`               | 🔒   | publish a profile photo (owner = session user)          |
| POST   | `/api/uploads`             | 🔒   | multipart `file` **or** `{url}` → `{url}` (R2)          |
| POST   | `/api/clicks`              | G    | `{source_type, source_id}` logs an affiliate click      |
| GET    | `/api/assets/<key>`        | —    | streams an uploaded image from R2                       |

---

## How the seed works

The schema is created/upgraded with **D1 migrations** (`worker/src/db/migrations/`,
applied via `wrangler d1 migrations apply`). `worker/src/db/seed.ts` (run with `tsx`)
then imports the **same** PBKDF2 module the Worker uses, hashes the demo passwords, and
writes `worker/src/db/seed.generated.sql` (`users` use `INSERT OR IGNORE` to preserve
accounts; poll/look content uses `INSERT OR REPLACE` to refresh demo imagery). So
seeded hashes can never drift from runtime hashes, and the DB never stores a plaintext
password.

Seed content: 2 creators, 6 polls (with captions + 2–4 affiliate tags; a few links use
a real affiliate host to show the verified check; seeded polls never expire), and 3
profile photos per creator with shoppable items — all curated Unsplash fashion imagery.

---

## npm scripts

| Script                 | What it does                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `dev`                  | build web, then run Vite + `wrangler dev` together            |
| `build` / `build:web`  | production build of the React app into `web/dist`             |
| `typecheck`            | typecheck the web app and the Worker                          |
| `gen:icons`            | regenerate the PWA icons                                      |
| `setup:local`          | icons + build + create & seed the **local** D1                |
| `db:migrate:local`     | apply D1 migrations to the local D1                           |
| `db:seed:local`        | regenerate seed SQL and apply it to the local D1             |
| `setup:remote`         | apply schema + seed to the **remote** D1                      |
| `deploy`               | build, then `wrangler deploy`                                 |

---

## Deploying to Cloudflare

See **[runbook.md](./runbook.md)** for the full step-by-step (creating the D1
database, the R2 bucket, applying the schema, seeding, and deploying the Worker).

Short version:

```bash
wrangler login
wrangler d1 create fip-db          # paste the printed database_id into wrangler.toml
wrangler r2 bucket create fip-assets
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

---

## Security notes & production upgrades (documented, not built)

- Passwords: PBKDF2-HMAC-SHA-256, 100k iterations, per-user 16-byte salt, base64.
- Sessions: 32-byte random token, httpOnly + `SameSite=Lax` (+ `Secure` over HTTPS),
  30-day expiry, stored as a SHA-256 hash and revoked on logout.
- **Production should add:** rate limiting on `/api/auth/*`, periodic session-token
  rotation, and — for true multi-user live tallies — a Cloudflare **Durable Object**
  per active poll broadcasting counts over WebSockets (the current MVP is
  server-authoritative on load + optimistic on vote, and other users see updated
  counts on their next queue fetch).

---

## PWA

Installable, with a web manifest, maskable icons, a service worker (app-shell cache +
network-first images, with `/api/*` never cached so no user's data leaks to another),
and an offline fallback screen.
