-- Rooms for watching together. What's happening right now (who's there, the
-- exact clock) lives in memory; this keeps a room's link working across
-- restarts, and picks up where everyone left off.
CREATE TABLE watch_rooms (
    code        TEXT PRIMARY KEY,                    -- the unguessable part of the link
    host_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id    INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    public      INTEGER NOT NULL DEFAULT 0,          -- anyone with the link, no account needed
    invited     TEXT NOT NULL DEFAULT '[]',          -- user ids, as JSON
    settings    TEXT NOT NULL DEFAULT '{}',          -- who controls playback, waiting for everyone
    tracks      TEXT NOT NULL DEFAULT '{}',          -- the audio and subtitles everyone gets
    position    REAL NOT NULL DEFAULT 0,
    paused      INTEGER NOT NULL DEFAULT 0,
    rate        REAL NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL,
    last_active INTEGER NOT NULL
);
CREATE INDEX watch_rooms_host ON watch_rooms(host_id);
