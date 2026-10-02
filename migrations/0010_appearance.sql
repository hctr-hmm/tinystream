-- Appearance: colour schemes people made, and how each person wants
-- tinystream to look.
--
-- `code` is the scheme itself (ts1.<payload>, see src/theme.rs). Published
-- schemes belong to the server: anyone can pick them, any admin can edit them,
-- and they outlive the account that made them. `forked_from` is the parent's
-- id (a built-in's name, or a row here), kept with its name in case it goes.
CREATE TABLE schemes (
    id               INTEGER PRIMARY KEY,
    owner_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name             TEXT NOT NULL,
    code             TEXT NOT NULL,
    published        INTEGER NOT NULL DEFAULT 0,
    forked_from      TEXT,
    forked_from_name TEXT,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
);
CREATE INDEX schemes_owner ON schemes(owner_id);

-- Only what differs from the server's defaults, as JSON, e.g.
-- {"colors": {"mode": "SINGLE", "single": "oled", ...}, "style": "FLAT", "mediaTint": true}.
-- The server's own defaults live in server_settings under 'appearance'.
ALTER TABLE users ADD COLUMN appearance TEXT NOT NULL DEFAULT '{}';
