# Magizhchi CRM — Build Prompt & Technical Blueprint

> Two-part deliverable:
> **Part A** is a copy-paste, builder-ready prompt (hand it to any AI builder or dev team).
> **Part B** is the technical blueprint (stack, architecture, data model, screens, theme, phasing) that backs the prompt.
>
> Target stack: **React + Tailwind CSS** (frontend) · **Spring Boot** (backend) · **PostgreSQL** (database).

---

# PART A — THE BUILD PROMPT

You are a senior full-stack team. Build a **multi-tenant SaaS CRM** called **Magizhchi CRM**. Follow this specification exactly. Where a behavior is "settings-driven," it must be controlled at runtime from the Company Account's settings — never hard-coded.

## 1. Product Concept

A lead-management CRM where every user signs up as exactly one of two account types:

1. **Company Account** — the master/owner account. The entire CRM process originates and is controlled here.
2. **Member Account** — a worker account that can only act on leads assigned to it by a Company Account it has joined.

A single login screen serves both; the account type is chosen at signup and determines the entire experience. A **member can belong to multiple companies at once** (fully isolated per company); the member's company list is visible across those companies, subject to restrictable settings (see §4a).

## 2. Roles & Access Model

- **Company Account (Owner/Admin):** full control — ingestion, members, products, assignment rules, settings, reporting, mail templates, notifications.
- **Member Account:** no lead ingestion. Sees and acts **only** on leads assigned to it, and **only** the fields/actions the Company's settings permit.
- **Designations** (e.g., Manager, Team Lead, Telecaller, Sales Exec) are defined by the Company and attached to each member. Notifications and visibility rules can target designations.
- **Hard isolation rule:** if a Company removes a member, that member must immediately lose access to **every** record, lead, note, reminder, and report tied to that company — not a single record may remain visible.

## 3. Company Account — Required Features

1. **Lead Ingestion (settings-driven).** Receive leads via:
   - **Excel/CSV upload** (column mapping UI to map sheet columns → CRM fields).
   - **Web service / REST API** (per-company API key, documented endpoint).
   - **Webhook** (inbound URL with secret/signature verification; field mapping).
   Provide a **Lead Sources / Ingestion Settings** screen to configure, enable/disable, and test each channel.
2. **Member Management.** Invite member accounts by email with a **designation**. Flow: Company sends a request → member receives & **accepts** → only then the member appears in the company's member list with their designation. Support pending/accepted/declined states.
3. **Products.** Create **products** (a product = a workflow/pipeline context). Leads, ingestion routing, assignment rules, and reporting are all scoped per product.
4. **Lead Assignment.** Assign leads to individual members **automatically** (round-robin, load-balanced, by designation, or by rule) **or manually** — chosen via settings. Support reassignment.
5. **Pipeline Visibility.** View live status of all leads: received, in follow-up, and closed (won/lost), with counts and drill-down per product/member/designation.
6. **Member Removal + Data Isolation.** Remove a member at any time; on removal, revoke all access instantly (see hard isolation rule §2).
7. **Real-time Notifications.** When a lead arrives, notify the appropriate **designations** per the notification settings (in-app + optional email).
8. **Member Visibility Settings.** Configure exactly which lead fields/sections a member can see (e.g., show phone but mask email, hide source, etc.).
9. **Mail Template Codes.** Create reusable **mail templates** — each with a subject + body and a short **code** (e.g., `WELCOME01`, `FOLLOWUP02`). Members select a code to send that templated mail to a lead. Support merge variables (e.g., `{{lead.name}}`, `{{member.name}}`).

## 4. Member Account — Required Features

1. **No ingestion.** Members can never create or import leads; they only receive assigned leads.
2. **Self-signup.** Anyone can create a member account independently.
3. **Useless until joined.** Until the member accepts an invite into a company, the account has no functional workspace (empty state prompting to join/accept).
4. **Removal = blank.** If removed by the company, no records show (§2).
5. **Lead actions (all settings-gated by the company):**
   - **Call** the lead (click-to-call / log call).
   - **Send mail** using a predefined **mail template code**.
   - **Create call notes.**
   - **Set reminders / follow-ups.**
   - **Send a payment request** via **UPI QR code** (v1): generate a UPI intent/QR (`upi://pay?...`) for the configured payee with amount + note; member shares/shows it to the lead. (Gateway providers like Razorpay/Stripe can be added later behind the same payment interface.)
   Each of these is shown/hidden and permitted per the Company's settings.

### 4a. Multi-Company Membership (cross-company visibility)

- A **member account can join multiple companies at once**, with each company's data fully isolated from the others.
- **Cross-company transparency:** the list of companies a member belongs to is visible to **all** companies that member has joined — i.e., Company A can see that this member is also a member of Company B/C.
- This cross-company visibility is itself **settings-driven and restrictable**: a company (and/or member) can limit what is exposed — e.g., hide the company list entirely, show company names only (no roles/details), or fully reveal. Default and override behavior live in settings.

## 5. Settings Are the Control Plane

Everything the member experiences is governed by Company settings: ingestion channels, assignment mode, visible fields, allowed actions (call/mail/notes/reminder/payment), notification targeting by designation, and available mail codes. Build a clean, grouped **Settings** area for the Company; members get a read-only effective-permissions view.

## 6. Design / Theme

- **Tone:** professional, clean, very easy to navigate, low learning curve.
- **Adaptable to any business theme** via design tokens (a company can pick its accent within the palette).
- **Palette:** orange, white, yellow, light blue, dark blue. White = surface; dark blue = primary text/nav; orange = primary action; yellow = highlight/warning accents; light blue = secondary/info.
- Responsive (desktop-first, tablet/mobile friendly), accessible (WCAG AA contrast), consistent component library.

## 7. Tech Stack (mandatory)

- **Frontend:** React + Vite + Tailwind CSS, React Router, TanStack Query, a lightweight component layer (shadcn-style or headless UI), React Hook Form + Zod.
- **Backend:** Spring Boot (Java 21), Spring Web, Spring Security (JWT), Spring Data JPA, Flyway migrations, Bean Validation.
- **Database:** PostgreSQL (multi-tenant via shared schema + `company_id` row scoping + row-level enforcement).
- **Infra/Support:** Redis (cache + notification pub/sub), WebSocket/STOMP for real-time notifications, **Amazon SES** for email, **UPI QR generation** for payments (v1; pluggable payment interface for future gateways), object storage (S3) for Excel uploads.

## 8. Non-Functional Requirements

- **Security:** JWT auth, BCrypt passwords, per-company data isolation enforced server-side on every query, signed webhooks, API keys hashed at rest, audit log of sensitive actions.
- **Multi-tenancy:** no cross-company data leakage — ever. Member removal cascades to access revocation.
- **Reliability:** idempotent ingestion, validation + error reporting on Excel import.
- **Observability:** structured logs, request tracing, ingestion metrics.

## 9. Acceptance Criteria (Definition of Done)

- A company can ingest leads via all three channels with field mapping and see them appear scoped to a product.
- A company can invite a member; member accepts; member appears with designation; member sees only permitted fields/actions.
- Auto and manual assignment both work and are switchable in settings.
- A removed member instantly sees zero records from that company.
- Lead arrival fires notifications to the configured designations in real time.
- A member can call, send a coded mail, log notes, set a reminder, and send a payment link — only where settings allow.
- The UI uses the specified palette and passes AA contrast.

---

# PART B — TECHNICAL BLUEPRINT

## 1. High-Level Architecture

```
                 ┌─────────────────────────────────────────────┐
                 │            React + Tailwind (SPA)            │
                 │  Company Console  |  Member Workspace        │
                 └───────────────┬──────────────┬──────────────┘
                                 │ REST/JSON     │ WebSocket (STOMP)
                                 ▼              ▼
                 ┌─────────────────────────────────────────────┐
                 │              Spring Boot API                 │
                 │  Auth · Tenancy filter · Modules (below)     │
                 └───┬──────────┬──────────┬──────────┬─────────┘
                     │          │          │          │
                     ▼          ▼          ▼          ▼
                PostgreSQL    Redis     SMTP/Email  Payment
                (data +      (cache/    provider    provider
                 RLS scope)   pub-sub)              (links)
                     ▲
        Inbound: Excel upload · REST ingestion · Webhook (signed)
```

## 2. Multi-Tenancy Strategy

- **Shared schema, row-scoped by `company_id`.**
- A Spring Security filter resolves the authenticated principal → `company_id` (for company users) or the set of joined+accepted companies (for members), and injects it into a request-scoped `TenantContext`.
- A JPA `@Filter` / Hibernate filter (or a mandatory `company_id` predicate in every repository query) enforces scoping at the data layer — defense in depth even if a query forgets the clause.
- **Member removal** flips the membership row to `REMOVED`; the tenancy filter excludes removed memberships, so the member's effective company set drops that company instantly → zero visible records.

## 3. Core Data Model (PostgreSQL)

Key tables (abbreviated):

| Table | Purpose / Key Columns |
|---|---|
| `account` | base identity: `id`, `email`, `password_hash`, `account_type` (`COMPANY`/`MEMBER`), `status` |
| `company` | `id`, `account_id`, `name`, `theme_accent`, `created_at` |
| `member_profile` | `id`, `account_id`, `display_name`, `phone` |
| `designation` | `id`, `company_id`, `name` (e.g., Telecaller, Manager) |
| `membership` | join of member→company: `id`, `company_id`, `member_account_id`, `designation_id`, `status` (`PENDING`/`ACCEPTED`/`DECLINED`/`REMOVED`), `invited_at`, `accepted_at` |
| `product` | `id`, `company_id`, `name`, `description`, `pipeline_config` |
| `lead` | `id`, `company_id`, `product_id`, `source`, `name`, `phone`, `email`, `custom_fields(jsonb)`, `status` (`NEW`/`ASSIGNED`/`FOLLOW_UP`/`WON`/`LOST`), `assigned_member_id`, `created_at` |
| `lead_event` | timeline: `id`, `lead_id`, `type` (CALL/MAIL/NOTE/REMINDER/PAYMENT/STATUS_CHANGE), `payload(jsonb)`, `actor_account_id`, `created_at` |
| `reminder` | `id`, `lead_id`, `member_account_id`, `remind_at`, `note`, `status` |
| `mail_template` | `id`, `company_id`, `code`, `subject`, `body`, `variables(jsonb)` |
| `ingestion_source` | `id`, `company_id`, `product_id`, `type` (EXCEL/API/WEBHOOK), `config(jsonb)`, `api_key_hash`, `webhook_secret`, `enabled` |
| `assignment_rule` | `id`, `company_id`, `product_id`, `mode` (MANUAL/ROUND_ROBIN/LOAD_BALANCED/BY_DESIGNATION/RULE), `config(jsonb)` |
| `visibility_setting` | `id`, `company_id`, `field_key`, `visible`, `masked` |
| `action_permission` | `id`, `company_id`, `action` (CALL/MAIL/NOTE/REMINDER/PAYMENT), `enabled` |
| `notification_setting` | `id`, `company_id`, `event` (LEAD_RECEIVED…), `target_designation_id`, `channels(jsonb)` |
| `notification` | `id`, `recipient_account_id`, `type`, `payload(jsonb)`, `read_at` |
| `payment_request` | `id`, `lead_id`, `member_account_id`, `amount`, `currency`, `method` (`UPI_QR` v1), `upi_vpa`, `upi_intent`, `qr_payload`, `provider`(future), `gateway_ref`(future), `link_url`(future), `status` (`SENT`/`PENDING` in v1; `PAID`/`FAILED` set by future gateway webhook) |
| `company_payment_config` | `id`, `company_id`, `upi_vpa`, `payee_name`, `enabled` — UPI payee details used to build QR/intents |
| `membership_visibility_setting` | `id`, `scope` (`COMPANY`/`MEMBER`), `owner_id`, `mode` (`HIDDEN`/`NAMES_ONLY`/`FULL`) — controls cross-company list exposure (§4a) |
| `audit_log` | `id`, `company_id`, `actor_account_id`, `action`, `entity`, `before/after(jsonb)`, `created_at` |

Notes: `custom_fields` and `*config` use `jsonb` for flexibility across business types; every tenant-scoped table carries `company_id` and is indexed on it.

## 4. Backend Module Breakdown (Spring Boot)

- `auth` — signup (company/member), login, JWT issue/refresh, password reset.
- `tenancy` — `TenantContext`, security filter, Hibernate scoping filter.
- `company` / `member` / `designation` — profiles & directory.
- `membership` — invite, accept/decline, remove (triggers access revocation + cascade hooks).
- `product` — CRUD, pipeline config.
- `ingestion` — Excel parser (Apache POI) + column mapping, REST ingest controller (API-key auth), webhook receiver (HMAC signature verify), validation + dedupe (idempotency key).
- `lead` — CRUD, status transitions, timeline (`lead_event`).
- `assignment` — strategy implementations (round-robin/load-balanced/by-designation/rule) + manual; pluggable via the `assignment_rule.mode`.
- `actions` — call logging, templated mail send (merge engine), notes, reminders, payment-link creation — each gated by `action_permission`.
- `mailtemplate` — CRUD + render/merge with variables.
- `notifications` — event bus (Redis pub/sub) → WebSocket push + email fan-out by designation.
- `settings` — visibility, actions, assignment, ingestion, notifications.
- `reporting` — pipeline counts, follow-up/closed dashboards.
- `audit` — cross-cutting audit aspect.

## 5. Lead Ingestion Detail

- **Excel/CSV:** upload → store file → parse with Apache POI → present mapping UI (sheet column → CRM field) → validate rows → import with per-row error report → emit `LEAD_RECEIVED` events.
- **REST API:** `POST /api/v1/ingest/{productId}/leads` authenticated by per-source API key (hashed at rest); JSON body mapped via source config; idempotency-key header to prevent dupes.
- **Webhook:** `POST /api/v1/webhooks/{sourceId}` with HMAC-SHA256 signature header verified against `webhook_secret`; configurable field mapping; returns 200 fast, processes async.

## 6. Notifications & Real-Time

- On `LEAD_RECEIVED` (and other events), resolve target designations from `notification_setting` → resolve member accounts in those designations → publish to Redis → WebSocket/STOMP pushes to connected clients + optional email.
- In-app notification center with read/unread; badge counts.

## 7. Mail Template Codes

- Company defines `mail_template(code, subject, body, variables)`.
- Member picks a code in the lead view → backend renders subject/body with merge vars from lead/member/company context → sends via SMTP → logs a `lead_event(type=MAIL)`.
- Only codes belonging to the member's company are selectable; sending is gated by `action_permission(MAIL)`.

## 8. Screen-by-Screen Plan

**Auth/Shared**
- Landing/login, signup (choose Company or Member), forgot password.

**Company Console**
- Dashboard (pipeline KPIs: received / follow-up / closed, per product & member).
- Leads (table, filters, status, assignee; bulk assign/reassign).
- Lead detail (timeline, events, reassign).
- Products (CRUD).
- Members (directory, invite, pending invites, designation, remove).
- Designations (CRUD).
- Ingestion settings (Excel mapping, API key, webhook + test).
- Assignment settings (mode + rules per product).
- Visibility settings (field show/mask).
- Action permissions (call/mail/note/reminder/payment toggles).
- Notification settings (event → designation → channels).
- Mail templates (code/subject/body/variables).
- Reports.
- Company profile & theme accent picker.

**Member Workspace**
- Empty state until joined/accepted; "join requests" inbox (accept/decline).
- My leads (assigned only; permitted fields only).
- Lead detail with permitted actions: call, send coded mail, add note, set reminder, send payment link.
- My reminders/follow-ups.
- Effective-permissions (read-only) view of what the company allows.

## 9. Design System / Theme Tokens

Tailwind theme extension (adaptable per company via CSS variables):

```js
// tailwind.config — colors
colors: {
  brand: {
    primary:   '#FF7A00', // orange — primary actions/CTAs
    highlight: '#FFC400', // yellow — highlights / warnings
    info:      '#4FC3F7', // light blue — secondary/info
    navy:      '#0D3B66', // dark blue — primary text / nav
    surface:   '#FFFFFF', // white — surfaces/cards
  }
}
```

- Company accent is stored in `company.theme_accent` and injected as a CSS variable so each tenant can re-skin within the palette.
- Components: buttons (orange primary, navy secondary, light-blue tertiary), cards (white + soft shadow), nav (dark blue), badges/status chips (yellow=pending/warn, light-blue=info, green/red for won/lost), accessible focus states, AA contrast.

## 10. Suggested Build Phasing

1. **Foundations:** auth, account types, tenancy filter, schema + Flyway, theme/design system.
2. **Org core:** company, members (invite/accept/remove + isolation), designations, products.
3. **Leads core:** manual lead create, lead model, timeline, status pipeline, dashboard.
4. **Ingestion:** Excel → API → Webhook with mapping & validation.
5. **Assignment:** manual + auto strategies, settings.
6. **Member actions:** call log, mail templates + send, notes, reminders.
7. **Notifications:** real-time + designation targeting.
8. **Settings polish:** visibility, action permissions, notification settings.
9. **Payments:** payment links/landing pages.
10. **Reporting, audit, hardening, multi-tenant security tests.**

---

## Decisions Locked In

- **Payments (v1):** UPI QR code only — generate `upi://pay?...` intent + QR from the company's UPI VPA + payee name; no gateway. **Verification is deferred to a future gateway (auto-verify), not manual confirmation.** In v1 a payment request stays in `SENT`/`PENDING` and is *not* marked paid in-app; when a gateway (Razorpay/Stripe/UPI PSP) is integrated later, it will auto-reconcile and flip status to `PAID` via webhook. The pluggable payment interface is designed now so that integration is additive.
- **Email:** Amazon SES for all outbound mail (coded templates, invites, notifications).
- **Member ↔ companies:** one member may join multiple companies, each isolated. The member's company list is visible across joined companies, restrictable via `membership_visibility_setting` (`HIDDEN` / `NAMES_ONLY` / `FULL`).

## Open Questions Still to Confirm

1. **Pricing/billing tiers** for the SaaS itself — needed, or out of scope for v1?
2. **Data residency / compliance** (India DPDP / GDPR) — any specific obligations?
3. **AWS region** for SES (and SES sandbox → production move, verified sender domains).
4. **Future gateway choice** (for the deferred payment auto-verify) — Razorpay / Stripe / a UPI PSP? Not needed for v1, but informs how the payment interface is shaped.
