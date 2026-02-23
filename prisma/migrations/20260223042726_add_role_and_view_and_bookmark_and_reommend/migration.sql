-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "AlbumList" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "PlaylistBookmark" (
    "userId" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistBookmark_pkey" PRIMARY KEY ("userId","playlistId")
);

-- CreateTable
CREATE TABLE "AlbumListBookmark" (
    "userId" UUID NOT NULL,
    "albumListId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumListBookmark_pkey" PRIMARY KEY ("userId","albumListId")
);

-- CreateTable
CREATE TABLE "PlaylistViewEvent" (
    "id" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "userId" UUID,
    "deviceId" TEXT,
    "lastCountedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumListViewEvent" (
    "id" UUID NOT NULL,
    "albumListId" UUID NOT NULL,
    "userId" UUID,
    "deviceId" TEXT,
    "lastCountedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlbumListViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedPlaylist" (
    "id" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "setByUserId" UUID,
    "note" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedAlbumList" (
    "id" UUID NOT NULL,
    "albumListId" UUID NOT NULL,
    "setByUserId" UUID,
    "note" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedAlbumList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaylistBookmark_playlistId_idx" ON "PlaylistBookmark"("playlistId");

-- CreateIndex
CREATE INDEX "AlbumListBookmark_albumListId_idx" ON "AlbumListBookmark"("albumListId");

-- CreateIndex
CREATE INDEX "PlaylistViewEvent_playlistId_lastCountedAt_idx" ON "PlaylistViewEvent"("playlistId", "lastCountedAt");

-- CreateIndex
CREATE INDEX "PlaylistViewEvent_userId_idx" ON "PlaylistViewEvent"("userId");

-- CreateIndex
CREATE INDEX "PlaylistViewEvent_deviceId_idx" ON "PlaylistViewEvent"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistViewEvent_playlistId_userId_key" ON "PlaylistViewEvent"("playlistId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistViewEvent_playlistId_deviceId_key" ON "PlaylistViewEvent"("playlistId", "deviceId");

-- CreateIndex
CREATE INDEX "AlbumListViewEvent_albumListId_lastCountedAt_idx" ON "AlbumListViewEvent"("albumListId", "lastCountedAt");

-- CreateIndex
CREATE INDEX "AlbumListViewEvent_userId_idx" ON "AlbumListViewEvent"("userId");

-- CreateIndex
CREATE INDEX "AlbumListViewEvent_deviceId_idx" ON "AlbumListViewEvent"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumListViewEvent_albumListId_userId_key" ON "AlbumListViewEvent"("albumListId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumListViewEvent_albumListId_deviceId_key" ON "AlbumListViewEvent"("albumListId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedPlaylist_playlistId_key" ON "FeaturedPlaylist"("playlistId");

-- CreateIndex
CREATE INDEX "FeaturedPlaylist_isActive_priority_createdAt_idx" ON "FeaturedPlaylist"("isActive", "priority", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeaturedPlaylist_startsAt_endsAt_idx" ON "FeaturedPlaylist"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "FeaturedPlaylist_setByUserId_idx" ON "FeaturedPlaylist"("setByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedAlbumList_albumListId_key" ON "FeaturedAlbumList"("albumListId");

-- CreateIndex
CREATE INDEX "FeaturedAlbumList_isActive_priority_createdAt_idx" ON "FeaturedAlbumList"("isActive", "priority", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeaturedAlbumList_startsAt_endsAt_idx" ON "FeaturedAlbumList"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "FeaturedAlbumList_setByUserId_idx" ON "FeaturedAlbumList"("setByUserId");

-- AddForeignKey
ALTER TABLE "PlaylistBookmark" ADD CONSTRAINT "PlaylistBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistBookmark" ADD CONSTRAINT "PlaylistBookmark_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListBookmark" ADD CONSTRAINT "AlbumListBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListBookmark" ADD CONSTRAINT "AlbumListBookmark_albumListId_fkey" FOREIGN KEY ("albumListId") REFERENCES "AlbumList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistViewEvent" ADD CONSTRAINT "PlaylistViewEvent_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistViewEvent" ADD CONSTRAINT "PlaylistViewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListViewEvent" ADD CONSTRAINT "AlbumListViewEvent_albumListId_fkey" FOREIGN KEY ("albumListId") REFERENCES "AlbumList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListViewEvent" ADD CONSTRAINT "AlbumListViewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedPlaylist" ADD CONSTRAINT "FeaturedPlaylist_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedPlaylist" ADD CONSTRAINT "FeaturedPlaylist_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedAlbumList" ADD CONSTRAINT "FeaturedAlbumList_albumListId_fkey" FOREIGN KEY ("albumListId") REFERENCES "AlbumList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedAlbumList" ADD CONSTRAINT "FeaturedAlbumList_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
