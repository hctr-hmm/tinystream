-- What each person has been told: new episodes, invitations, requests.
-- The live copy goes out over /api/events; this is the inbox they come back to.
CREATE TABLE notifications (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,                  -- aired | ready | invite | request | requestApproved | requestDeclined
    priority   INTEGER NOT NULL DEFAULT 0,     -- 1 shows in the pill until it's dealt with
    title      TEXT NOT NULL,
    body       TEXT,
    image      TEXT,                           -- a URL
    link       TEXT,                           -- a path in the web UI
    actor_id   INTEGER REFERENCES users(id) ON DELETE SET NULL, -- whoever caused it, for their picture
    created_at INTEGER NOT NULL,
    expires_at INTEGER,                        -- invitations stop mattering
    read_at    INTEGER
);
CREATE INDEX notifications_user ON notifications(user_id, created_at DESC);

-- When an episode's airing was announced, so it's only announced once.
-- Everything that has already aired counts as announced.
ALTER TABLE episodes ADD COLUMN announced_at INTEGER;
UPDATE episodes SET announced_at = COALESCE(air_at, 0) WHERE aired = 1 OR air_at <= CAST(strftime('%s', 'now') AS INTEGER);
