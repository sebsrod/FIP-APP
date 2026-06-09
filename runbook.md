# FIP — Cloudflare Deployment Runbook

Step-by-step instructions to deploy FIP to Cloudflare: the **Worker** (app + API),
**D1** (database), and **R2** (image bucket). Commands are copy-paste ready.

Everything runs on Cloudflare's free tier for a demo. Estimated time: ~10 minutes.

---

## 0. Prerequisites

- A **Cloudflare account** (free): https://dash.cloudflare.com/sign-up
- **Node 18+** and **npm**
- The project installed locally:

  ```bash
  npm install
  ```

- Wrangler is already a dev dependency — run it via `npx wrangler …` (no global
  install needed). Verify:

  ```bash
  npx wrangler --version
  ```

---

## 1. Authenticate Wrangler

**Interactive (local machine):**

```bash
npx wrangler login
```

This opens a browser to authorize Wrangler against your account.

**Non-interactive (CI / headless):** create an API token at
**dash.cloudflare.com → My Profile → API Tokens** using the *"Edit Cloudflare
Workers"* template (it includes Workers Scripts, D1, and R2 permissions), then:

```bash
export CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# If your token is account-scoped, also set:
export CLOUDFLARE_ACCOUNT_ID=your_account_id
```

Confirm you're authenticated:

```bash
npx wrangler whoami
```

---

## 2. Create the D1 database

```bash
npx wrangler d1 create fip-db
```

Output ends with a `[[d1_databases]]` block containing a real `database_id`, e.g.:

```
[[d1_databases]]
binding = "DB"
database_name = "fip-db"
database_id = "a1b2c3d4-5678-90ab-cdef-1234567890ab"
```

**Edit `wrangler.toml`** and replace the placeholder `database_id` with the value
just printed:

```toml
[[d1_databases]]
binding = "DB"
database_name = "fip-db"
database_id = "a1b2c3d4-5678-90ab-cdef-1234567890ab"   # <-- paste yours here
```

> The `binding = "DB"` and `database_name` must stay as-is — the Worker code and the
> npm scripts reference `fip-db` and the `DB` binding.

---

## 3. Create the R2 bucket

```bash
npx wrangler r2 bucket create fip-assets
```

The bucket name `fip-assets` matches the `[[r2_buckets]]` binding in `wrangler.toml`
(`binding = "BUCKET"`). **No public access configuration is required** — FIP streams
uploaded images back through the Worker at `GET /api/assets/<key>`, keeping them
same-origin.

> First time using R2 on this account? You may be prompted to enable R2 in the
> dashboard (it's free to enable). Follow the link Wrangler prints, then re-run.

---

## 4. Apply the schema to the remote database

```bash
npm run db:migrate:remote
# = npx wrangler d1 migrations apply fip-db --remote
```

Schema changes ship as **D1 migrations** (`worker/src/db/migrations/`). `migrations
apply` runs only the not-yet-applied files and tracks them, so it's safe to re-run and
upgrades an existing database (with `ALTER`s) without losing data.

---

## 5. Seed the remote database

```bash
npm run db:seed:remote
```

This regenerates `worker/src/db/seed.generated.sql` (hashing the demo passwords
through the real PBKDF2 path) and applies it with `wrangler d1 execute fip-db
--remote`. It's idempotent: user accounts are preserved (`INSERT OR IGNORE`) while
poll/look content is refreshed (`INSERT OR REPLACE`), so re-running it updates the
demo imagery without creating duplicates.

Verify the rows (and that no plaintext passwords were stored):

```bash
npx wrangler d1 execute fip-db --remote \
  --command "SELECT username, substr(password_hash,1,10) AS hash, substr(password_salt,1,8) AS salt, followers_count FROM users;"
```

You should see `demo` and `studio` with hash/salt prefixes (never a plaintext value).

---

## 6. Build and deploy the Worker

```bash
npm run deploy
# = gen:icons + vite build + wrangler deploy
```

Wrangler uploads `web/dist` as static assets and the Worker bundle. On success it
prints your deployment URL, e.g.:

```
https://fip.<your-subdomain>.workers.dev
```

---

## 7. Verify

1. Open the printed `*.workers.dev` URL — you land straight on the **Poll feed as a
   guest** (no login needed).
2. **Vote** by tapping an image → centered percentages → losing side goes high-key
   monochrome → after ~2s the next poll loads. Guest votes count.
3. Tap a crimson dot → the glass shop HUD opens (with a verified check on affiliate
   brands) → tapping it logs a click and opens the link.
4. Tap **＋** (center) or **Profile** → an auth popup appears. Log in with
   **`demo` / `demo1234`** (or tap the demo chip).
5. **＋ creates a poll:** split screen, camera/gallery per side, tap to drop red item
   tags (Brand/Product/Price/Link + verified check), then a caption popup → publish
   (the poll expires in 60 minutes).
6. **Profile:** a red ring around the avatar means active polls — tap it to review the
   live split (owner) or vote (visitors). The Profile **＋** publishes a permanent photo.
7. **Search** (top icon) finds other creators; open a profile and vote on their polls.
8. Log out (Profile) → you return to browsing as a guest.

Confirm analytics rows are landing:

```bash
npx wrangler d1 execute fip-db --remote \
  --command "SELECT (SELECT COUNT(*) FROM votes) v, (SELECT COUNT(*) FROM affiliate_clicks) c, (SELECT COUNT(*) FROM sessions) s;"
```

---

## 8. (Optional) Custom domain

Map the Worker to a domain you've added to Cloudflare. In `wrangler.toml`:

```toml
routes = [
  { pattern = "fip.example.com", custom_domain = true }
]
```

Then redeploy:

```bash
npm run deploy
```

Cloudflare provisions the TLS certificate automatically. The `Secure` cookie flag is
applied automatically because the request is HTTPS.

---

## Operations

**Tail live logs:**

```bash
npx wrangler tail
```

**Open a one-off SQL shell against production:**

```bash
npx wrangler d1 execute fip-db --remote --command "SELECT COUNT(*) FROM polls;"
```

**Redeploy after code changes:**

```bash
npm run deploy
```

**Roll back:** from the Cloudflare dashboard → Workers & Pages → `fip` → Deployments,
choose a previous deployment and "Rollback".

**Inspect / manage R2 objects:**

```bash
npx wrangler r2 object get fip-assets/<key> --file ./out.jpg
npx wrangler r2 object list fip-assets   # (or use the dashboard)
```

---

## Teardown (delete everything)

```bash
npx wrangler delete                                  # remove the Worker
npx wrangler d1 delete fip-db                         # remove the database
npx wrangler r2 bucket delete fip-assets              # remove the bucket (empty it first)
```

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Couldn't find a D1 DB ... database_id` on deploy | You didn't paste the real `database_id` into `wrangler.toml` (step 2). |
| `10000` / auth errors from Wrangler | Re-run `npx wrangler login`, or check `CLOUDFLARE_API_TOKEN` scopes (needs Workers + D1 + R2). |
| R2 commands fail with "not enabled" | Enable R2 once in the dashboard (free), then retry `r2 bucket create`. |
| Login works but reloading logs you out | Ensure you're on **HTTPS** (the `*.workers.dev` URL is HTTPS) so the `Secure` cookie is stored. |
| Images don't appear | Seed imagery is external (Unsplash CDN / dicebear avatars) and needs outbound connectivity from the browser; uploaded images are served from R2 via `/api/assets/...`. |
| Static assets 404 after deploy | Run `npm run build:web` (or `npm run deploy`, which builds) so `web/dist` exists before upload. |
| Want a clean DB | `npx wrangler d1 execute fip-db --remote --command "DROP TABLE IF EXISTS ..."` then re-run steps 4–5, or delete & recreate the database. |

---

## What got deployed

- **Worker `fip`** — serves the built React PWA (Workers Assets) and the `/api/*`
  JSON API from one origin.
- **D1 `fip-db`** — users, sessions, polls, votes, tags, looks, look_items,
  affiliate_clicks.
- **R2 `fip-assets`** — uploaded look/poll images, streamed back via the Worker.

All three are referenced by name/binding in `wrangler.toml`; keep those names in sync
if you rename anything.
