ALTER TABLE "PlaylistComment"
  ADD COLUMN "parentId" UUID,
  ADD COLUMN "rootId" UUID;

ALTER TABLE "AlbumListComment"
  ADD COLUMN "parentId" UUID,
  ADD COLUMN "rootId" UUID;

DO $$
BEGIN
  IF to_regclass('"ArtistListComment"') IS NOT NULL THEN
    ALTER TABLE "ArtistListComment"
      ADD COLUMN "parentId" UUID,
      ADD COLUMN "rootId" UUID;
  END IF;
END $$;

ALTER TABLE "MusicPollComment"
  ADD COLUMN "parentId" UUID,
  ADD COLUMN "rootId" UUID;

CREATE INDEX "PlaylistComment_parentId_createdAt_idx" ON "PlaylistComment"("parentId", "createdAt");
CREATE INDEX "PlaylistComment_rootId_createdAt_idx" ON "PlaylistComment"("rootId", "createdAt");
CREATE INDEX "AlbumListComment_parentId_createdAt_idx" ON "AlbumListComment"("parentId", "createdAt");
CREATE INDEX "AlbumListComment_rootId_createdAt_idx" ON "AlbumListComment"("rootId", "createdAt");
DO $$
BEGIN
  IF to_regclass('"ArtistListComment"') IS NOT NULL THEN
    CREATE INDEX "ArtistListComment_parentId_createdAt_idx" ON "ArtistListComment"("parentId", "createdAt");
    CREATE INDEX "ArtistListComment_rootId_createdAt_idx" ON "ArtistListComment"("rootId", "createdAt");
  END IF;
END $$;
CREATE INDEX "MusicPollComment_parentId_createdAt_idx" ON "MusicPollComment"("parentId", "createdAt");
CREATE INDEX "MusicPollComment_rootId_createdAt_idx" ON "MusicPollComment"("rootId", "createdAt");

ALTER TABLE "PlaylistComment"
  ADD CONSTRAINT "PlaylistComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PlaylistComment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PlaylistComment_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "PlaylistComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AlbumListComment"
  ADD CONSTRAINT "AlbumListComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AlbumListComment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "AlbumListComment_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "AlbumListComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF to_regclass('"ArtistListComment"') IS NOT NULL THEN
    ALTER TABLE "ArtistListComment"
      ADD CONSTRAINT "ArtistListComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ArtistListComment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      ADD CONSTRAINT "ArtistListComment_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ArtistListComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "MusicPollComment"
  ADD CONSTRAINT "MusicPollComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MusicPollComment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "MusicPollComment_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "MusicPollComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
