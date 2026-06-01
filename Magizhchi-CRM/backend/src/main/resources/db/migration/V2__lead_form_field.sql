-- Company-designed Add-Lead form fields.
CREATE TABLE lead_form_field (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    field_key   VARCHAR(80)  NOT NULL,
    label       VARCHAR(160) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'TEXT'
                CHECK (type IN ('TEXT','TEXTAREA','NUMBER','PHONE','EMAIL','DATE','DROPDOWN')),
    role        VARCHAR(20)  NOT NULL DEFAULT 'NONE'
                CHECK (role IN ('NONE','NAME','PHONE','EMAIL')),
    required    BOOLEAN      NOT NULL DEFAULT FALSE,
    options     JSONB        NOT NULL DEFAULT '[]'::jsonb,
    placeholder VARCHAR(160),
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (company_id, field_key)
);
CREATE INDEX idx_lead_form_field_company ON lead_form_field(company_id);
