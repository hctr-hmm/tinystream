-- Clips: a range of a video rendered to an MP4 that plays anywhere.
--
-- The row is the recipe (which file, which range, which tracks, which
-- quality) and costs nothing to keep. The rendered file is the expensive part:
-- it can be evicted when its owner runs out of space and made again later.
CREATE TABLE clips (
    id           INTEGER PRIMARY KEY,
    code         TEXT NOT NULL UNIQUE,             -- the unguessable part of its public link
    owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL DEFAULT '',

    -- Where it came from. The media row can go (a file replaced or removed),
    -- so what's needed to show and name the clip is copied here.
    media_id     INTEGER REFERENCES media(id) ON DELETE SET NULL,
    item_id      INTEGER REFERENCES items(id) ON DELETE SET NULL,
    library      TEXT NOT NULL,
    source_path  TEXT NOT NULL,
    source_size  INTEGER NOT NULL,                 -- with source_mtime: is it still the same file?
    source_mtime INTEGER NOT NULL,
    show_title   TEXT NOT NULL,
    kind         TEXT NOT NULL,                    -- show | movie
    label        TEXT,                             -- S01E05
    year         INTEGER,

    -- The recipe.
    range_start  REAL NOT NULL,                    -- seconds into the source
    range_end    REAL NOT NULL,
    audio        INTEGER,                          -- stream index; NULL is the default track
    subtitles    TEXT,                             -- track id (s3, x0); NULL is none
    height       INTEGER NOT NULL,                 -- 1080 | 720 | 480, fitted to 16:9
    half_rate    INTEGER NOT NULL DEFAULT 0,       -- half the source frame rate (60 → 30)

    -- The render.
    state        TEXT NOT NULL DEFAULT 'queued',   -- queued | rendering | ready | failed | evicted
    error        TEXT,
    bytes        INTEGER,
    width_px     INTEGER,
    height_px    INTEGER,
    fps          REAL,
    rendered_at  INTEGER,

    public       INTEGER NOT NULL DEFAULT 0,       -- anyone with the link; never evicted
    created_at   INTEGER NOT NULL,
    viewed_at    INTEGER                           -- least recently watched goes first
);
CREATE INDEX clips_owner ON clips(owner_id, created_at DESC);

-- Who a clip was sent to. Recipients can hide it from their own list; the
-- owner still sees they sent it.
CREATE TABLE clip_shares (
    clip_id   INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_at INTEGER NOT NULL,
    hidden    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (clip_id, user_id)
);
CREATE INDEX clip_shares_user ON clip_shares(user_id, shared_at DESC);
