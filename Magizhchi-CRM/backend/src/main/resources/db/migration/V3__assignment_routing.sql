-- Rule-based auto-assignment config (routes + fallback) on the assignment rule.
ALTER TABLE assignment_rule
    ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;
