-- CreateTable
CREATE TABLE "FeaturedPlaylistSection" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedPlaylistSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedAlbumListSection" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedAlbumListSection_pkey" PRIMARY KEY ("id")
);

-- Seed default sections used for backfill
INSERT INTO "FeaturedPlaylistSection" ("id", "key", "name", "isActive", "priority", "createdAt", "updatedAt")
VALUES ('11111111-1111-1111-1111-111111111111', 'featured', '추천', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "FeaturedAlbumListSection" ("id", "key", "name", "isActive", "priority", "createdAt", "updatedAt")
VALUES ('22222222-2222-2222-2222-222222222222', 'featured', '추천', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "FeaturedPlaylist" ADD COLUMN "sectionId" UUID;
ALTER TABLE "FeaturedAlbumList" ADD COLUMN "sectionId" UUID;

-- Backfill existing featured rows into default section
UPDATE "FeaturedPlaylist"
SET "sectionId" = '11111111-1111-1111-1111-111111111111'
WHERE "sectionId" IS NULL;

UPDATE "FeaturedAlbumList"
SET "sectionId" = '22222222-2222-2222-2222-222222222222'
WHERE "sectionId" IS NULL;

-- Make new columns required
ALTER TABLE "FeaturedPlaylist" ALTER COLUMN "sectionId" SET NOT NULL;
ALTER TABLE "FeaturedAlbumList" ALTER COLUMN "sectionId" SET NOT NULL;

-- Replace old one-to-one uniqueness with section-scoped uniqueness
DROP INDEX IF EXISTS "FeaturedPlaylist_playlistId_key";
DROP INDEX IF EXISTS "FeaturedAlbumList_albumListId_key";

CREATE UNIQUE INDEX "FeaturedPlaylist_playlistId_sectionId_key" ON "FeaturedPlaylist"("playlistId", "sectionId");
CREATE UNIQUE INDEX "FeaturedAlbumList_albumListId_sectionId_key" ON "FeaturedAlbumList"("albumListId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedPlaylistSection_key_key" ON "FeaturedPlaylistSection"("key");
CREATE UNIQUE INDEX "FeaturedAlbumListSection_key_key" ON "FeaturedAlbumListSection"("key");

CREATE INDEX "FeaturedPlaylistSection_isActive_priority_createdAt_idx" ON "FeaturedPlaylistSection"("isActive", "priority", "createdAt" DESC);
CREATE INDEX "FeaturedAlbumListSection_isActive_priority_createdAt_idx" ON "FeaturedAlbumListSection"("isActive", "priority", "createdAt" DESC);

CREATE INDEX "FeaturedPlaylist_sectionId_isActive_priority_createdAt_idx" ON "FeaturedPlaylist"("sectionId", "isActive", "priority", "createdAt" DESC);
CREATE INDEX "FeaturedAlbumList_sectionId_isActive_priority_createdAt_idx" ON "FeaturedAlbumList"("sectionId", "isActive", "priority", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "FeaturedPlaylist" ADD CONSTRAINT "FeaturedPlaylist_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FeaturedPlaylistSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeaturedAlbumList" ADD CONSTRAINT "FeaturedAlbumList_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FeaturedAlbumListSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
