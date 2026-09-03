ALTER TABLE "Track" ADD COLUMN "artistSpotifyId" TEXT;
ALTER TABLE "Album" ADD COLUMN "artistSpotifyId" TEXT;

ALTER TABLE "MusicSearchAlias"
  ALTER COLUMN "alias" DROP NOT NULL,
  ADD COLUMN "spotifyId" TEXT,
  ADD COLUMN "context" TEXT,
  ADD COLUMN "imageUrl" TEXT;

CREATE UNIQUE INDEX "MusicSearchAlias_type_spotifyId_key"
  ON "MusicSearchAlias"("type", "spotifyId");

CREATE INDEX "MusicSearchAlias_spotifyId_idx"
  ON "MusicSearchAlias"("spotifyId");

INSERT INTO "MusicSearchAlias" ("type", "canonical", "alias", "spotifyId", "context", "imageUrl", "createdAt", "updatedAt")
SELECT 'TRACK_TITLE'::"MusicAliasType", "title", NULL, "spotifyId", "artist", "albumCover", NOW(), NOW()
FROM "Track"
ON CONFLICT ("type", "spotifyId") DO NOTHING;

INSERT INTO "MusicSearchAlias" ("type", "canonical", "alias", "spotifyId", "context", "imageUrl", "createdAt", "updatedAt")
SELECT 'ALBUM_TITLE'::"MusicAliasType", "title", NULL, "spotifyId", "artist", "coverImage", NOW(), NOW()
FROM "Album"
ON CONFLICT ("type", "spotifyId") DO NOTHING;
