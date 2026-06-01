# Deploy Magizhchi CRM to Railway (production)

Target: backend + frontend on **Railway**, with a Railway-managed **PostgreSQL**,
served under your domain `magizhchi.software`:

- **Backend API** → `https://crm-api.magizhchi.software`
- **Frontend app** → `https://crm.magizhchi.software`

You'll create **3 Railway services** in one project: Postgres, Backend, Frontend.
Everything you need (Dockerfiles, port handling, CORS, `.env` loading) is already in
the repo.

---

## 0. Prerequisites (one time)
- A Railway account (railway.app) — Hobby plan is fine to start.
- The repo pushed to GitHub (Railway deploys from GitHub).
- Access to DNS for `magizhchi.software` (to add two CNAME records).

> If the repo isn't on GitHub yet: create a private repo and push. Railway needs it
> to build. (Railway can also deploy via its CLI, but GitHub is simplest.)

---

## 1. Create the project + PostgreSQL
1. Railway → **New Project** → **Provision PostgreSQL**.
2. Open the Postgres service → **Variables** tab. Railway exposes:
   `PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE` and a ready-made
   `DATABASE_URL`. You'll reference these from the backend.

---

## 2. Backend service (Spring Boot)
1. **New → Deploy from GitHub repo** → pick your repo.
2. **Settings → Root Directory** = `backend` (so it uses `backend/Dockerfile`).
   Railway auto-detects the Dockerfile.
3. **Variables** (Settings → Variables) — add:

   | Variable | Value |
   |---|---|
   | `DB_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
   | `DB_USER` | `${{Postgres.PGUSER}}` |
   | `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
   | `APP_JWT_SECRET` | a fresh Base64 256-bit secret (see below) |
   | `APP_CORS_ORIGINS` | `https://crm.magizhchi.software` |

   The `${{Postgres.*}}` syntax is Railway's cross-service reference — it auto-fills
   from the Postgres service. (`PORT` is injected by Railway automatically; the app
   already reads it.)

   Generate a JWT secret locally:
   ```bash
   # any of these:
   openssl rand -base64 48
   # or in Node:
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

4. **Deploy.** Watch the build logs — Flyway runs the migrations (V1–V4) against the
   Railway Postgres on first boot, creating all tables.
5. **Settings → Networking → Generate Domain** to get a temporary
   `*.up.railway.app` URL. Test it: `https://<that>/swagger-ui/index.html` should load.

> First boot note: `spring.flyway.baseline-on-migrate=true` is already set, so a
> fresh empty DB migrates cleanly.

---

## 3. Frontend service (React/Vite static)
1. **New → Deploy from GitHub repo** → same repo.
2. **Settings → Root Directory** = `frontend`.
3. **Variables** → add a **build-time** var:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://crm-api.magizhchi.software` |

   (Vite bakes this in at build time — the Dockerfile passes it through. This is how
   the frontend knows where the API lives in production instead of the dev proxy.)

4. **Deploy.** Generate a domain to test; the login page should load.

> If you set `VITE_API_URL` to the backend's temporary `*.up.railway.app` first to
> test before DNS is ready, just rebuild after switching to the real domain (the URL
> is compiled in, so a change requires a redeploy).

---

## 4. Custom domains
In each service → **Settings → Networking → Custom Domain**:

- Backend service → add `crm-api.magizhchi.software`
- Frontend service → add `crm.magizhchi.software`

Railway shows a **CNAME target** for each (like `xxxx.up.railway.app`). In your DNS
provider for `magizhchi.software`, add:

| Type | Name | Value |
|---|---|---|
| CNAME | `crm-api` | (target Railway shows for backend) |
| CNAME | `crm` | (target Railway shows for frontend) |

Railway issues HTTPS (Let's Encrypt) automatically once DNS resolves (a few minutes).

> After domains are live, make sure these still match:
> - Backend `APP_CORS_ORIGINS = https://crm.magizhchi.software`
> - Frontend `VITE_API_URL = https://crm-api.magizhchi.software` (rebuild frontend if changed)

---

## 5. Verify the live deployment
1. Open `https://crm.magizhchi.software` → log in (your company account).
2. The browser calls `https://crm-api.magizhchi.software/api/v1/...` — check the
   Network tab shows 200s (not CORS errors).
3. Create a lead, open Members, etc.

---

## 6. Point the enquiry form at production
Once live, your `apply.magizhchi.academy/enquiry` integration uses:
```
POST https://crm-api.magizhchi.software/api/v1/ingest/<SOURCE-ID>/leads
Header: X-API-Key: <key>
```
(See `docs/connect-apply-enquiry-form.md`. Re-create the API source in the **production**
CRM to get a production key — the local dev key won't exist in the prod database.)

---

## Cost & ops notes
- Hobby plan ≈ $5/mo of usage credit; this app (small JVM + tiny static server +
  Postgres) fits comfortably for low traffic. Watch the backend's memory — the
  Dockerfile caps heap at 75% of the container.
- **Backups:** enable Postgres backups in the Railway Postgres service settings.
- **Logs:** each service has a Logs tab. The dev-mode `[MAIL DEV]` lines appear here
  until you wire real email (Amazon SES).
- **Migrations:** any new `Vn__*.sql` you add runs automatically on the next deploy.

---

## Still deferred (needs your input later)
- **Real email** (Amazon SES) for mail templates — currently logs only.
- **OTP / forgot-password** — depends on the email choice above.
- **Payments (UPI QR)** — separate feature.

These don't block the deployment; the CRM runs fully without them.
