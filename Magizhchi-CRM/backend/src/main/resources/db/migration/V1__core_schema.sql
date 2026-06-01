-- Magizhchi CRM — core schema (Phase 1 lays the full multi-tenant model)
-- All tenant-scoped tables carry company_id and are indexed on it.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
CREATE TABLE account (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    account_type    VARCHAR(20)  NOT NULL CHECK (account_type IN ('COMPANY','MEMBER')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE company (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL UNIQUE REFERENCES account(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    theme_accent    VARCHAR(20)  NOT NULL DEFAULT '#FF7A00',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE member_profile (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL UNIQUE REFERENCES account(id) ON DELETE CASCADE,
    display_name    VARCHAR(200) NOT NULL,
    phone           VARCHAR(40),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Org structure
-- ---------------------------------------------------------------------------
CREATE TABLE designation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (company_id, name)
);
CREATE INDEX idx_designation_company ON designation(company_id);

CREATE TABLE membership (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    member_account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    designation_id     UUID REFERENCES designation(id) ON DELETE SET NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','ACCEPTED','DECLINED','REMOVED')),
    invited_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at        TIMESTAMPTZ,
    UNIQUE (company_id, member_account_id)
);
CREATE INDEX idx_membership_company ON membership(company_id);
CREATE INDEX idx_membership_member  ON membership(member_account_id);
CREATE INDEX idx_membership_status  ON membership(status);

CREATE TABLE product (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    pipeline_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_company ON product(company_id);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
CREATE TABLE lead (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    product_id         UUID REFERENCES product(id) ON DELETE SET NULL,
    source             VARCHAR(20) NOT NULL DEFAULT 'MANUAL'
                        CHECK (source IN ('MANUAL','EXCEL','API','WEBHOOK')),
    name               VARCHAR(200),
    phone              VARCHAR(40),
    email              VARCHAR(255),
    custom_fields      JSONB NOT NULL DEFAULT '{}'::jsonb,
    status             VARCHAR(20) NOT NULL DEFAULT 'NEW'
                        CHECK (status IN ('NEW','ASSIGNED','FOLLOW_UP','WON','LOST')),
    assigned_member_id UUID REFERENCES account(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_company  ON lead(company_id);
CREATE INDEX idx_lead_product  ON lead(product_id);
CREATE INDEX idx_lead_assignee ON lead(assigned_member_id);
CREATE INDEX idx_lead_status   ON lead(status);

CREATE TABLE lead_event (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    lead_id            UUID NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
    type               VARCHAR(20) NOT NULL
                        CHECK (type IN ('CALL','MAIL','NOTE','REMINDER','PAYMENT','STATUS_CHANGE','ASSIGNMENT')),
    payload            JSONB NOT NULL DEFAULT '{}'::jsonb,
    actor_account_id   UUID REFERENCES account(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_event_lead    ON lead_event(lead_id);
CREATE INDEX idx_lead_event_company ON lead_event(company_id);

CREATE TABLE reminder (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    lead_id            UUID NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
    member_account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    remind_at          TIMESTAMPTZ NOT NULL,
    note               TEXT,
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','DONE','CANCELLED')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reminder_company ON reminder(company_id);
CREATE INDEX idx_reminder_member  ON reminder(member_account_id);

-- ---------------------------------------------------------------------------
-- Mail templates
-- ---------------------------------------------------------------------------
CREATE TABLE mail_template (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    code            VARCHAR(40) NOT NULL,
    subject         VARCHAR(300) NOT NULL,
    body            TEXT NOT NULL,
    variables       JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (company_id, code)
);
CREATE INDEX idx_mail_template_company ON mail_template(company_id);

-- ---------------------------------------------------------------------------
-- Ingestion & assignment
-- ---------------------------------------------------------------------------
CREATE TABLE ingestion_source (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES product(id) ON DELETE SET NULL,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('EXCEL','API','WEBHOOK')),
    config          JSONB NOT NULL DEFAULT '{}'::jsonb,
    api_key_hash    VARCHAR(255),
    webhook_secret  VARCHAR(255),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ingestion_company ON ingestion_source(company_id);

CREATE TABLE assignment_rule (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES product(id) ON DELETE CASCADE,
    mode            VARCHAR(30) NOT NULL DEFAULT 'MANUAL'
                    CHECK (mode IN ('MANUAL','ROUND_ROBIN','LOAD_BALANCED','BY_DESIGNATION','RULE')),
    config          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assignment_company ON assignment_rule(company_id);

-- ---------------------------------------------------------------------------
-- Settings (control plane)
-- ---------------------------------------------------------------------------
CREATE TABLE visibility_setting (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    field_key       VARCHAR(80) NOT NULL,
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    masked          BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (company_id, field_key)
);

CREATE TABLE action_permission (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    action          VARCHAR(20) NOT NULL
                    CHECK (action IN ('CALL','MAIL','NOTE','REMINDER','PAYMENT')),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (company_id, action)
);

CREATE TABLE notification_setting (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    event                 VARCHAR(40) NOT NULL,
    target_designation_id UUID REFERENCES designation(id) ON DELETE CASCADE,
    channels              JSONB NOT NULL DEFAULT '["IN_APP"]'::jsonb
);
CREATE INDEX idx_notif_setting_company ON notification_setting(company_id);

CREATE TABLE notification (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    company_id           UUID REFERENCES company(id) ON DELETE CASCADE,
    type                 VARCHAR(40) NOT NULL,
    payload              JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at              TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_recipient ON notification(recipient_account_id);

-- Cross-company membership visibility (HIDDEN / NAMES_ONLY / FULL)
CREATE TABLE membership_visibility_setting (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope           VARCHAR(20) NOT NULL CHECK (scope IN ('COMPANY','MEMBER')),
    owner_id        UUID NOT NULL,
    mode            VARCHAR(20) NOT NULL DEFAULT 'NAMES_ONLY'
                    CHECK (mode IN ('HIDDEN','NAMES_ONLY','FULL')),
    UNIQUE (scope, owner_id)
);

-- ---------------------------------------------------------------------------
-- Payments (v1 = UPI QR; verification deferred to a future gateway)
-- ---------------------------------------------------------------------------
CREATE TABLE company_payment_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL UNIQUE REFERENCES company(id) ON DELETE CASCADE,
    upi_vpa         VARCHAR(120),
    payee_name      VARCHAR(200),
    enabled         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE payment_request (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    lead_id            UUID NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
    member_account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    amount             NUMERIC(14,2) NOT NULL,
    currency           VARCHAR(8) NOT NULL DEFAULT 'INR',
    method             VARCHAR(20) NOT NULL DEFAULT 'UPI_QR' CHECK (method IN ('UPI_QR')),
    upi_vpa            VARCHAR(120),
    upi_intent         TEXT,
    qr_payload         TEXT,
    provider           VARCHAR(40),
    gateway_ref        VARCHAR(120),
    link_url           TEXT,
    status             VARCHAR(20) NOT NULL DEFAULT 'SENT'
                        CHECK (status IN ('SENT','PENDING','PAID','FAILED','CANCELLED')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_company ON payment_request(company_id);
CREATE INDEX idx_payment_lead    ON payment_request(lead_id);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id       UUID REFERENCES company(id) ON DELETE CASCADE,
    actor_account_id UUID REFERENCES account(id) ON DELETE SET NULL,
    action           VARCHAR(80) NOT NULL,
    entity           VARCHAR(80),
    details          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_company ON audit_log(company_id);
