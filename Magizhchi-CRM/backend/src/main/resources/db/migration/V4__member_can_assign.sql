-- Manager capability: a member can be granted permission to assign leads.
ALTER TABLE membership
    ADD COLUMN IF NOT EXISTS can_assign BOOLEAN NOT NULL DEFAULT FALSE;
