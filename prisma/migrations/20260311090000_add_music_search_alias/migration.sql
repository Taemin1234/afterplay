-- CreateEnum
CREATE TYPE "MusicAliasType" AS ENUM ('TRACK_ARTIST', 'TRACK_TITLE', 'ALBUM_ARTIST', 'ALBUM_TITLE');

-- CreateTable
CREATE TABLE "MusicSearchAlias" (
    "id" SERIAL NOT NULL,
    "type" "MusicAliasType" NOT NULL,
    "canonical" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicSearchAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MusicSearchAlias_alias_idx" ON "MusicSearchAlias"("alias");

-- CreateIndex
CREATE INDEX "MusicSearchAlias_canonical_idx" ON "MusicSearchAlias"("canonical");

-- CreateIndex
CREATE UNIQUE INDEX "MusicSearchAlias_type_canonical_alias_key" ON "MusicSearchAlias"("type", "canonical", "alias");
