-- Music. Tracks hold what their tags say; albums and artists are worked out
-- from them on every scan, keeping their ids as long as their keys hold.

CREATE TABLE tracks (
    id            INTEGER PRIMARY KEY,
    library       TEXT NOT NULL,
    album_id      INTEGER REFERENCES albums(id) ON DELETE SET NULL,
    path          TEXT NOT NULL UNIQUE,
    size          INTEGER NOT NULL,
    mtime         INTEGER NOT NULL,
    album_key     TEXT NOT NULL,                     -- which album it belongs to, from its own tags
    title         TEXT NOT NULL,
    artist        TEXT NOT NULL,                     -- as tagged, for display
    artists       TEXT NOT NULL DEFAULT '[]',        -- each one, as JSON
    artist_sort   TEXT,
    album         TEXT NOT NULL,
    album_artist  TEXT,
    album_artists TEXT NOT NULL DEFAULT '[]',
    album_artist_sort TEXT,
    album_sort    TEXT,
    composers     TEXT NOT NULL DEFAULT '[]',
    compilation   INTEGER NOT NULL DEFAULT 0,
    disc          INTEGER,
    disc_subtitle TEXT,
    number        INTEGER,
    year          INTEGER,
    release_date  TEXT,
    original_date TEXT,
    genres        TEXT NOT NULL DEFAULT '[]',
    release_types TEXT NOT NULL DEFAULT '[]',
    labels        TEXT NOT NULL DEFAULT '[]',
    mbid          TEXT,                              -- the recording
    album_mbid    TEXT,
    artist_mbids  TEXT NOT NULL DEFAULT '[]',
    album_artist_mbids TEXT NOT NULL DEFAULT '[]',
    bpm           INTEGER,
    comment       TEXT,
    lyrics        TEXT,                              -- embedded, LRC or plain
    duration      REAL NOT NULL,
    codec         TEXT NOT NULL,                     -- flac, alac, mp3, aac, opus, vorbis, pcm, ape, wavpack, musepack
    suffix        TEXT NOT NULL,
    bitrate       INTEGER,                           -- kbit/s
    sample_rate   INTEGER,
    bit_depth     INTEGER,
    channels      INTEGER,
    embedded_art  INTEGER NOT NULL DEFAULT 0,
    rg_track_gain REAL,                              -- ReplayGain from the tags, dB
    rg_track_peak REAL,
    rg_album_gain REAL,
    rg_album_peak REAL,
    loudness      REAL,                              -- measured here (EBU R128 integrated, LUFS)
    peak          REAL,                              -- measured sample peak, linear
    analyzed      INTEGER NOT NULL DEFAULT 0,        -- 1 measured, -1 couldn't be
    added_at      INTEGER NOT NULL
);
CREATE INDEX tracks_album ON tracks(album_id, disc, number);
CREATE INDEX tracks_library ON tracks(library, album_key);
CREATE INDEX tracks_unanalyzed ON tracks(analyzed) WHERE analyzed = 0;

CREATE TABLE albums (
    id            INTEGER PRIMARY KEY,
    library       TEXT NOT NULL,
    key           TEXT NOT NULL,                     -- the MusicBrainz release, or title and folder
    title         TEXT NOT NULL,
    sort_title    TEXT NOT NULL,
    artist        TEXT NOT NULL,                     -- the album artist, for display
    year          INTEGER,
    release_date  TEXT,
    original_date TEXT,
    genres        TEXT NOT NULL DEFAULT '[]',
    release_types TEXT NOT NULL DEFAULT '[]',
    labels        TEXT NOT NULL DEFAULT '[]',
    disc_titles   TEXT NOT NULL DEFAULT '[]',        -- [[disc, title], …]
    compilation   INTEGER NOT NULL DEFAULT 0,
    mbid          TEXT,
    dir           TEXT NOT NULL,
    cover_track   INTEGER,                           -- a track with a picture in it, when the folder has none
    loudness      REAL,                              -- measured over all its tracks
    added_at      INTEGER NOT NULL,
    UNIQUE (library, key)
);
CREATE INDEX albums_added ON albums(library, added_at);

CREATE TABLE artists (
    id        INTEGER PRIMARY KEY,
    library   TEXT NOT NULL,
    key       TEXT NOT NULL,                         -- the name, lowercased
    name      TEXT NOT NULL,
    sort_name TEXT NOT NULL,
    mbid      TEXT,
    added_at  INTEGER NOT NULL,
    UNIQUE (library, key)
);

CREATE TABLE album_artists (
    album_id  INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    position  INTEGER NOT NULL,
    PRIMARY KEY (album_id, artist_id)
);
CREATE INDEX album_artists_artist ON album_artists(artist_id);

CREATE TABLE track_artists (
    track_id  INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    role      TEXT NOT NULL,                         -- artist or composer
    position  INTEGER NOT NULL,
    PRIMARY KEY (track_id, artist_id, role)
);
CREATE INDEX track_artists_artist ON track_artists(artist_id, role);

-- What people did with it. Like progress, these hold on to paths and keys
-- rather than ids, so they outlive a library being removed and added back.
-- target: a track's path, or `library/key` of an album or artist.
CREATE TABLE stars (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL CHECK (kind IN ('track', 'album', 'artist')),
    target     TEXT NOT NULL,
    starred_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, kind, target)
);

CREATE TABLE ratings (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind    TEXT NOT NULL CHECK (kind IN ('track', 'album', 'artist')),
    target  TEXT NOT NULL,
    rating  INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    PRIMARY KEY (user_id, kind, target)
);

CREATE TABLE plays (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_path TEXT NOT NULL,
    played_at  INTEGER NOT NULL
);
CREATE INDEX plays_user ON plays(user_id, played_at);
CREATE INDEX plays_track ON plays(track_path, user_id);

CREATE TABLE playlists (
    id         INTEGER PRIMARY KEY,
    owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    comment    TEXT,
    public     INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE playlist_tracks (
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    track_path  TEXT NOT NULL,
    PRIMARY KEY (playlist_id, position)
);

-- Everyone's queue, shared by the web player and every Subsonic app.
CREATE TABLE play_queues (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tracks     TEXT NOT NULL DEFAULT '[]',           -- track ids, as JSON; the same one may be there twice
    current    INTEGER NOT NULL DEFAULT 0,           -- index into tracks
    position   REAL NOT NULL DEFAULT 0,              -- seconds into the current one
    shuffled   INTEGER NOT NULL DEFAULT 0,
    repeat     TEXT NOT NULL DEFAULT 'off',
    changed_by TEXT,
    updated_at INTEGER NOT NULL
);

-- Passwords for music apps. Subsonic's token sign-in needs the password
-- itself, so these are kept as they are; they open nothing but the music API.
CREATE TABLE app_passwords (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    secret     TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    last_used  INTEGER,
    client     TEXT                                  -- the app that last used it
);
CREATE INDEX app_passwords_user ON app_passwords(user_id);

-- Lyrics found online, and lookups that found nothing (both empty).
CREATE TABLE lyrics (
    track_path TEXT PRIMARY KEY,
    synced     TEXT,
    plain      TEXT,
    fetched_at INTEGER NOT NULL
);

-- Listening together: a queue instead of one video.
CREATE TABLE listen_rooms (
    code        TEXT PRIMARY KEY,
    host_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    queue       TEXT NOT NULL DEFAULT '[]',          -- track ids, as JSON
    current     INTEGER NOT NULL DEFAULT 0,
    public      INTEGER NOT NULL DEFAULT 0,
    invited     TEXT NOT NULL DEFAULT '[]',
    settings    TEXT NOT NULL DEFAULT '{}',
    position    REAL NOT NULL DEFAULT 0,
    paused      INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    last_active INTEGER NOT NULL
);
CREATE INDEX listen_rooms_host ON listen_rooms(host_id);
