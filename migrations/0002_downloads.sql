-- Downloads and library management. Tables exist in every build; they stay
-- empty when tinystream is built without the `torrent` feature.

-- Requests from this person are approved without an admin.
ALTER TABLE users ADD COLUMN auto_approve INTEGER NOT NULL DEFAULT 0;

-- A show tinystream manages: what to watch for, where it goes, how it's named.
-- Linked to `items` by path; a show added from search has no folder (or item)
-- until its first episode is imported.
CREATE TABLE series (
    id           INTEGER PRIMARY KEY,
    library      TEXT NOT NULL,
    path         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    year         INTEGER,
    provider     TEXT,                          -- anilist | tmdb
    provider_id  TEXT,
    poster       TEXT,
    backdrop     TEXT,
    overview     TEXT,
    monitor      TEXT NOT NULL DEFAULT 'none',  -- none | future | missing
    profile      TEXT,                          -- a [[profile]] name; NULL uses the library's
    sources      TEXT NOT NULL DEFAULT '[]',    -- pinned [[source]] names, in order; [] means all
    groups       TEXT NOT NULL DEFAULT '[]',    -- pinned release groups; override the profile's
    aliases      TEXT NOT NULL DEFAULT '[]',    -- extra titles to search for and match, from people
    known_as     TEXT NOT NULL DEFAULT '[]',    -- other titles, from the metadata provider
    numbering    TEXT NOT NULL DEFAULT 'auto',  -- auto | seasonal | absolute
    naming       TEXT,                          -- file name template; NULL means inferred
    seeding      TEXT,                          -- JSON seeding rules; NULL uses the source's or global
    status       TEXT,                          -- airing | finished | upcoming (from the provider)
    monitored_at INTEGER,                       -- when monitoring was last turned on
    schedule_at  INTEGER,                       -- when the schedule was last refreshed
    added_at     INTEGER NOT NULL
);

-- Seasons as the provider sees them (for AniList, one entry per season).
CREATE TABLE series_seasons (
    series_id   INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    season      INTEGER NOT NULL,
    provider_id TEXT,
    title       TEXT,
    aliases     TEXT NOT NULL DEFAULT '[]',     -- the provider's other titles for this season
    episodes    INTEGER,                        -- episode count, when known
    PRIMARY KEY (series_id, season)
);

-- Every episode we know of, aired or not, and where the hunt for it stands.
CREATE TABLE episodes (
    series_id   INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    season      INTEGER NOT NULL,
    episode     INTEGER NOT NULL,
    absolute    INTEGER,
    title       TEXT,
    air_at      INTEGER,                        -- unix time; NULL when unknown
    aired       INTEGER NOT NULL DEFAULT 0,     -- aired, even when the exact time isn't known
    state       TEXT NOT NULL DEFAULT 'idle',   -- idle | wanted | grabbed | missing | done
    attempts    INTEGER NOT NULL DEFAULT 0,
    wanted_at   INTEGER,                        -- when it became wanted
    searched_at INTEGER,
    next_search INTEGER,
    download_id INTEGER,
    PRIMARY KEY (series_id, season, episode)
);
CREATE INDEX episodes_air ON episodes(air_at);
CREATE INDEX episodes_due ON episodes(state, next_search);

CREATE TABLE downloads (
    id           INTEGER PRIMARY KEY,
    hash         TEXT UNIQUE,                   -- info-hash (hex), once known
    name         TEXT NOT NULL,                 -- the release's title
    series_id    INTEGER REFERENCES series(id) ON DELETE SET NULL,
    episodes     TEXT NOT NULL DEFAULT '[]',    -- [[season, episode], ...] it was grabbed for
    source       TEXT,
    link         TEXT NOT NULL,                 -- magnet or .torrent URL
    size         INTEGER,
    save_path    TEXT NOT NULL,
    state        TEXT NOT NULL DEFAULT 'downloading', -- downloading | seeding | paused | done | failed | removed
    import_state TEXT NOT NULL DEFAULT 'pending',     -- pending | done | failed | skipped
    import_error TEXT,
    import_mode  TEXT,                          -- how it was imported: hardlink | copy | move
    error        TEXT,
    torrent      BLOB,                          -- the .torrent file, when there was one
    resume       BLOB,
    seeding      TEXT,                          -- JSON seeding rules decided when grabbed
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    added_at     INTEGER NOT NULL,
    finished_at  INTEGER,
    imported_at  INTEGER,
    removed_at   INTEGER
);

-- Every change tinystream makes to a library, so it can be undone.
CREATE TABLE file_ops (
    id        INTEGER PRIMARY KEY,
    batch     TEXT NOT NULL,                    -- ops that happened together ("import 12", "rename 3f2a…")
    label     TEXT NOT NULL,                    -- what the batch was, for people
    kind      TEXT NOT NULL,                    -- rename | hardlink | copy | move | mkdir
    src       TEXT,
    dst       TEXT NOT NULL,
    at        INTEGER NOT NULL,
    undone_at INTEGER
);
CREATE INDEX file_ops_batch ON file_ops(batch);

CREATE TABLE rename_suggestions (
    id         INTEGER PRIMARY KEY,
    library    TEXT NOT NULL,
    src        TEXT NOT NULL UNIQUE,
    dst        TEXT NOT NULL,
    reason     TEXT NOT NULL,
    confidence TEXT NOT NULL,                   -- high | low
    state      TEXT NOT NULL DEFAULT 'pending', -- pending | applied | dismissed
    created_at INTEGER NOT NULL
);

CREATE TABLE requests (
    id          INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider    TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    title       TEXT NOT NULL,
    year        INTEGER,
    poster      TEXT,
    overview    TEXT,
    library     TEXT,
    state       TEXT NOT NULL DEFAULT 'pending', -- pending | approved | declined
    series_id   INTEGER REFERENCES series(id) ON DELETE SET NULL,
    note        TEXT,
    created_at  INTEGER NOT NULL,
    decided_at  INTEGER,
    decided_by  INTEGER REFERENCES users(id) ON DELETE SET NULL
);
