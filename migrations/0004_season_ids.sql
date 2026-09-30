-- The provider's entries for each season in a library, as a JSON array of
-- ids. AniList lists every season (and each half of a split one) on its own,
-- so this is how a later season is recognised as a show that's already here.
ALTER TABLE seasons ADD COLUMN provider_ids TEXT NOT NULL DEFAULT '[]';

-- Fetch AniList shows again to fill it in.
UPDATE media SET title = NULL WHERE item_id IN (SELECT id FROM items WHERE provider = 'anilist' AND kind = 'show');
