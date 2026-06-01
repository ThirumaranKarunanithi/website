# Magizhchi CRM

A multi-tenant lead-management CRM. Two account types — **Company** (master: ingestion, members, products, assignment, settings) and **Member** (works only the leads assigned to it, gated by the company's settings).

- 📄 Full spec & blueprint: [`docs/CRM-Build-Prompt-and-Blueprint.md`](docs/CRM-Build-Prompt-and-Blueprint.md)
- 🧱 Stack: **React + Vite + Tailwind** · **Spring Boot 3 / Java 17** · **PostgreSQL + Flyway**

## Status

**Phase 1 — Foundations (done):** account types, signup/login with JWT, request-scoped tenancy context, full core DB schema (Flyway `V1`), and the design system + app shells (auth screens, company dashboard, member workspace). Later modules are scaffolded as "coming next" placeholders.

## Project layout

```
backend/    Spring Boot API (Java 17, Maven)
frontend/   React + Vite + Tailwind SPA
docs/       Product spec & technical blueprint
docker-compose.yml   Postgres + Redis for local dev
```

## Run it locally

### 1. Database
```bash
docker compose up -d            # starts Postgres on :5432 (db: magizhchi_crm)
```
Or use a local PostgreSQL and create a `magizhchi_crm` database.

### 2. Backend (http://localhost:8080)
```bash
cd backend
mvn spring-boot:run
```
Flyway runs `V1__core_schema.sql` on startup. Swagger UI: http://localhost:8080/swagger-ui.html

Config is env-driven (see `backend/.env.example`); defaults point at the docker-compose DB.

### 3. Frontend (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```
Vite proxies `/api` → `:8080`, so no extra config is needed in dev.

## Try the flow
1. Open http://localhost:5173 → **Create account**.
2. Pick **Company** (needs a company name) or **Member** (needs your name).
3. You're routed to the matching workspace; the JWT is stored and `/api/v1/me` rehydrates on refresh.

## Theme
Palette: orange (primary action), white (surface), yellow (highlight/warn), light blue (info), dark blue (nav/text). Per-tenant accent via the `--brand-accent` CSS variable / `company.theme_accent`. Tokens live in `frontend/tailwind.config.js` and `frontend/src/index.css`.

## Roadmap
See the "Suggested Build Phasing" section of the blueprint — Phase 2 is org core (members invite/accept/remove, designations, products).
