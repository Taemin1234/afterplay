ALTER TABLE "Playlist"
ADD COLUMN "contentBlocks" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "AlbumList"
ADD COLUMN "contentBlocks" JSONB NOT NULL DEFAULT '[]'::jsonb;
