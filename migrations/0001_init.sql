CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    handle        TEXT NOT NULL UNIQUE,              -- stable UUID, used as the WebAuthn user handle
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    is_admin      INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL
);

CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    last_seen  INTEGER NOT NULL
);

CREATE TABLE passkeys (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    credential TEXT NOT NULL,                        -- serialized webauthn-rs SecurityKey
    created_at INTEGER NOT NULL,
    last_used  INTEGER
);

-- Libraries are identified by their name in config.toml.
CREATE TABLE library_access (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    library TEXT NOT NULL,
    PRIMARY KEY (user_id, library)
);

CREATE TABLE items (
    id            INTEGER PRIMARY KEY,
    library       TEXT NOT NULL,
    kind          TEXT NOT NULL CHECK (kind IN ('show', 'movie')),
    path          TEXT NOT NULL UNIQUE,
    folder_title  TEXT NOT NULL,                     -- title parsed from the folder name
    folder_year   INTEGER,
    title         TEXT NOT NULL,
    sort_title    TEXT NOT NULL,
    year          INTEGER,
    overview      TEXT,
    genres        TEXT NOT NULL DEFAULT '[]',
    rating        REAL,
    poster        TEXT,                              -- remote URL; local art is found on disk
    backdrop      TEXT,
    provider      TEXT,
    provider_id   TEXT,
    match_state   TEXT NOT NULL DEFAULT 'pending',   -- pending | matched | unmatched | manual
    added_at      INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
);
CREATE INDEX items_library ON items(library, sort_title);

CREATE TABLE seasons (
    item_id  INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    number   INTEGER NOT NULL,
    title    TEXT,
    overview TEXT,
    poster   TEXT,
    PRIMARY KEY (item_id, number)
);

CREATE TABLE media (
    id          INTEGER PRIMARY KEY,
    item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    path        TEXT NOT NULL UNIQUE,
    season      INTEGER,
    episode     INTEGER,
    episode_end INTEGER,
    title       TEXT,
    overview    TEXT,
    still       TEXT,
    air_date    TEXT,
    size        INTEGER NOT NULL,
    mtime       INTEGER NOT NULL,
    duration    REAL,
    added_at    INTEGER NOT NULL
);
CREATE INDEX media_item ON media(item_id, season, episode);

-- Keyed by path rather than media id, so watch history survives a library
-- being removed and re-added, or a full rescan.
CREATE TABLE progress (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_path TEXT NOT NULL,
    position   REAL NOT NULL,
    duration   REAL NOT NULL,
    finished   INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, media_path)
);
CREATE INDEX progress_recent ON progress(user_id, updated_at DESC);

CREATE TABLE skipped (
    path    TEXT PRIMARY KEY,
    library TEXT NOT NULL,
    reason  TEXT NOT NULL,
    seen_at INTEGER NOT NULL
);
