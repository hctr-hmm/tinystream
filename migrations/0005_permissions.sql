-- Permissions: server-wide defaults plus each person's overrides.
--
-- `server_settings` holds state that belongs to the server but not in
-- config.toml; 'permission-defaults' is written on first start (from the old
-- [requests] mode, if there was one).
CREATE TABLE server_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Only what differs from the defaults, as JSON, e.g.
-- {"downloads": true, "allLibraries": false, "libraries": ["Anime"]}.
-- A key that isn't there follows the defaults.
ALTER TABLE users ADD COLUMN permissions TEXT NOT NULL DEFAULT '{}';

-- Library access used to be an explicit list for everyone; keep it that way
-- for existing people so nobody sees more than before.
UPDATE users SET permissions = json_object(
    'allLibraries', json('false'),
    'libraries', json((SELECT json_group_array(library) FROM library_access WHERE user_id = users.id))
) WHERE is_admin = 0;
UPDATE users SET permissions = json_set(permissions, '$.autoApprove', json('true')) WHERE auto_approve = 1;

DROP TABLE library_access;
ALTER TABLE users DROP COLUMN auto_approve;

-- Profile pictures, already cropped and resized by the browser.
CREATE TABLE avatars (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    mime       TEXT NOT NULL,
    data       BLOB NOT NULL,
    updated_at INTEGER NOT NULL
);
