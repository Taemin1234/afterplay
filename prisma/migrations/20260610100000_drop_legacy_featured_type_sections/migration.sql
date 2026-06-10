-- Legacy type-specific featured section tables are no longer used.
-- FeaturedSection / FeaturedItem now hold the unified section model.
ALTER TABLE "FeaturedPlaylist" DROP CONSTRAINT IF EXISTS "FeaturedPlaylist_sectionId_fkey";
ALTER TABLE "FeaturedAlbumList" DROP CONSTRAINT IF EXISTS "FeaturedAlbumList_sectionId_fkey";

DROP TABLE IF EXISTS "FeaturedPlaylistSection";
DROP TABLE IF EXISTS "FeaturedAlbumListSection";
