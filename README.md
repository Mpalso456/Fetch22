# Fetch 22 — Flat Root (Safe Version)

Includes both App Router (`app/`) and Pages Router fallback (`pages/`) plus a `/health` route to avoid 404s while deploying.

## Deploy checklist (Vercel)
1. Repo root must contain: `package.json`, `app/`, `pages/`, `next.config.mjs`.
2. In Vercel → Project → Settings → General → **Root Directory**: leave blank (or `/`). Save.
3. Do **not** set Output Directory. Redeploy.
4. Visit `/`, `/health`, `/pricing`.

If you still see 404, your project likely points to the wrong directory; set Root Directory to `/` and redeploy.
