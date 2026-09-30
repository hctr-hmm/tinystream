-- A season AniList splits in two ("Season 2" and "Season 2 Part 2") is now
-- one season, as libraries and release groups number it. The later halves'
-- titles and where they start within the season, as JSON:
-- [{"offset": 13, "episodes": 12, "aliases": [...]}, ...]
ALTER TABLE series_seasons ADD COLUMN parts TEXT NOT NULL DEFAULT '[]';

-- AniList shows were numbered one entry per season; fetch them again.
UPDATE series SET schedule_at = NULL WHERE provider = 'anilist';
UPDATE media SET title = NULL WHERE item_id IN (SELECT id FROM items WHERE provider = 'anilist' AND kind = 'show');
