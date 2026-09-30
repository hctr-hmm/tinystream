-- Screenshots: a clip of one frame, rendered to a PNG at the video's own size.
--
-- They live with clips so they're sent, linked, counted and dropped the same
-- way. range_start = range_end is the moment; height 0 is the source's size.
ALTER TABLE clips ADD COLUMN screenshot INTEGER NOT NULL DEFAULT 0;
