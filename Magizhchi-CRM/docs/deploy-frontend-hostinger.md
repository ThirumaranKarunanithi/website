# Deploy the frontend to Hostinger (backend stays on Railway)

Split hosting:
- **Frontend** (this React/Vite app) → **Hostinger** at `https://crm.magizhchi.software`
- **Backend API** → Railway at `https://crm-api.magizhchi.software` (see `deploy-railway.md`)
- **Database** → Railway-managed PostgreSQL

The frontend is a static build (`dist/`), so Hostinger just serves files. The only
special piece is an `.htaccess` (already in `frontend/public/.htaccess`) that makes
React Router deep-links work on refresh — it's copied into `dist/` automatically.

---

## 1. Deploy the BACKEND first (Railway)
The frontend bakes the API URL in at build time, so the backend should exist first.
Follow `docs/deploy-railway.md` and get the backend live at
`https://crm-api.magizhchi.software`. Set its CORS to allow the Hostinger origin:

```
APP_CORS_ORIGINS = https://crm.magizhchi.software
```

---

## 2. Build the frontend for production (on your PC)
The production API URL is in `frontend/.env.production`:
```
VITE_API_URL=https://crm-api.magizhchi.software
```
(Change it if your backend domain differs.) Then:

```bash
cd frontend
npm ci          # or: npm install
npm run build
```

This produces `frontend/dist/` containing:
- `index.html`
- `assets/…` (hashed JS/CSS)
- `.htaccess`  ← SPA routing + caching (verify it's there: `ls -a dist`)

> Verified: the prod build compiles `crm-api.magizhchi.software` into the bundle and
> includes `.htaccess`.

---

## 3. Upload to Hostinger
Use **hPanel → File Manager** (or FTP, e.g. FileZilla).

1. Decide where `crm.magizhchi.software` points:
   - **Subdomain approach (recommended):** hPanel → **Subdomains** → create
     `crm` under `magizhchi.software`. Hostinger creates a folder like
     `domains/magizhchi.software/public_html/crm` (or a dedicated docroot).
2. **Upload the *contents* of `dist/`** (not the `dist` folder itself) into that
   subdomain's document root — `index.html`, `assets/`, and `.htaccess` should sit
   at the root.
   - Tip: zip `dist`, upload the zip, then **Extract** in File Manager — fastest.
   - In File Manager, enable "show hidden files" so you can confirm `.htaccess`
     uploaded (dot-files are hidden by default).
3. SSL: hPanel → **SSL** → ensure the certificate covers `crm.magizhchi.software`
   (Hostinger auto-provisions free SSL; enable **Force HTTPS**).

---

## 4. DNS for crm.magizhchi.software
If the domain is managed at Hostinger and you used the **Subdomain** feature, DNS is
handled for you — nothing to do.

If `magizhchi.software` DNS is elsewhere, add an **A record** for `crm` pointing to
your Hostinger site's IP (hPanel shows it under **DNS / Nameservers** or the hosting
plan's details).

---

## 5. Verify
1. Open `https://crm.magizhchi.software` → the login page loads.
2. Log in. In the browser **Network** tab, requests go to
   `https://crm-api.magizhchi.software/api/v1/...` and return **200** (no CORS error).
3. Navigate to `/company`, refresh the page → it still loads (this confirms
   `.htaccess` SPA routing works — without it you'd get a 404 on refresh).

### If you see a CORS error
The backend's `APP_CORS_ORIGINS` must exactly equal `https://crm.magizhchi.software`
(no trailing slash, https not http). Fix it on Railway and redeploy the backend.

### If refresh on /company gives 404
`.htaccess` didn't upload (it's hidden) or mod_rewrite is off. Re-upload it and
confirm it's in the docroot. Hostinger supports `.htaccess` on Apache/LiteSpeed.

---

## 6. Redeploying after changes
Frontend changes → rebuild (`npm run build`) and re-upload `dist/` contents.
Because `index.html` is set to no-cache and assets are content-hashed, users get the
new version immediately without manual cache clearing.

> Reminder: `VITE_API_URL` is **compiled in**. If the backend URL ever changes, edit
> `.env.production`, rebuild, and re-upload.

---

## Recap of the split
| Piece | Where | URL |
|---|---|---|
| Frontend (static) | Hostinger | https://crm.magizhchi.software |
| Backend API | Railway | https://crm-api.magizhchi.software |
| PostgreSQL | Railway | (internal) |

Enquiry-form integration then posts to
`https://crm-api.magizhchi.software/api/v1/ingest/<id>/leads` (see
`docs/connect-apply-enquiry-form.md`; recreate the API source in the prod CRM).
