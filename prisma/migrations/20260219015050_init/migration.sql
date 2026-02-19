-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" UUID NOT NULL,
    "followingId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "authorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" UUID NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "albumCover" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumList" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "authorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AlbumList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" UUID NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumEntry" (
    "id" UUID NOT NULL,
    "albumListId" UUID NOT NULL,
    "albumId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTag" (
    "playlistId" UUID NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "PlaylistTag_pkey" PRIMARY KEY ("playlistId","tagId")
);

-- CreateTable
CREATE TABLE "AlbumListTag" (
    "albumListId" UUID NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "AlbumListTag_pkey" PRIMARY KEY ("albumListId","tagId")
);

-- CreateTable
CREATE TABLE "PlaylistLike" (
    "userId" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistLike_pkey" PRIMARY KEY ("userId","playlistId")
);

-- CreateTable
CREATE TABLE "AlbumListLike" (
    "userId" UUID NOT NULL,
    "albumListId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumListLike_pkey" PRIMARY KEY ("userId","albumListId")
);

-- CreateTable
CREATE TABLE "PlaylistComment" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PlaylistComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumListComment" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "albumListId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AlbumListComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Playlist_authorId_idx" ON "Playlist"("authorId");

-- CreateIndex
CREATE INDEX "Playlist_createdAt_idx" ON "Playlist"("createdAt");

-- CreateIndex
CREATE INDEX "Playlist_visibility_idx" ON "Playlist"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "Track_spotifyId_key" ON "Track"("spotifyId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_playlistId_idx" ON "PlaylistTrack"("playlistId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_trackId_idx" ON "PlaylistTrack"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_order_key" ON "PlaylistTrack"("playlistId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_trackId_key" ON "PlaylistTrack"("playlistId", "trackId");

-- CreateIndex
CREATE INDEX "AlbumList_authorId_idx" ON "AlbumList"("authorId");

-- CreateIndex
CREATE INDEX "AlbumList_createdAt_idx" ON "AlbumList"("createdAt");

-- CreateIndex
CREATE INDEX "AlbumList_visibility_idx" ON "AlbumList"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "Album_spotifyId_key" ON "Album"("spotifyId");

-- CreateIndex
CREATE INDEX "AlbumEntry_albumListId_idx" ON "AlbumEntry"("albumListId");

-- CreateIndex
CREATE INDEX "AlbumEntry_albumId_idx" ON "AlbumEntry"("albumId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumEntry_albumListId_order_key" ON "AlbumEntry"("albumListId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumEntry_albumListId_albumId_key" ON "AlbumEntry"("albumListId", "albumId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "PlaylistTag_tagId_idx" ON "PlaylistTag"("tagId");

-- CreateIndex
CREATE INDEX "AlbumListTag_tagId_idx" ON "AlbumListTag"("tagId");

-- CreateIndex
CREATE INDEX "PlaylistLike_playlistId_idx" ON "PlaylistLike"("playlistId");

-- CreateIndex
CREATE INDEX "AlbumListLike_albumListId_idx" ON "AlbumListLike"("albumListId");

-- CreateIndex
CREATE INDEX "PlaylistComment_playlistId_createdAt_idx" ON "PlaylistComment"("playlistId", "createdAt");

-- CreateIndex
CREATE INDEX "PlaylistComment_userId_idx" ON "PlaylistComment"("userId");

-- CreateIndex
CREATE INDEX "AlbumListComment_albumListId_createdAt_idx" ON "AlbumListComment"("albumListId", "createdAt");

-- CreateIndex
CREATE INDEX "AlbumListComment_userId_idx" ON "AlbumListComment"("userId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumList" ADD CONSTRAINT "AlbumList_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumEntry" ADD CONSTRAINT "AlbumEntry_albumListId_fkey" FOREIGN KEY ("albumListId") REFERENCES "AlbumList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumEntry" ADD CONSTRAINT "AlbumEntry_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTag" ADD CONSTRAINT "PlaylistTag_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTag" ADD CONSTRAINT "PlaylistTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListTag" ADD CONSTRAINT "AlbumListTag_albumListId_fkey" FOREIGN KEY ("albumListId") REFERENCES "AlbumList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListTag" ADD CONSTRAINT "AlbumListTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistLike" ADD CONSTRAINT "PlaylistLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistLike" ADD CONSTRAINT "PlaylistLike_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListLike" ADD CONSTRAINT "AlbumListLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListLike" ADD CONSTRAINT "AlbumListLike_albumListId_fkey" FOREIGN KEY ("albumListId") REFERENCES "AlbumList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistComment" ADD CONSTRAINT "PlaylistComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistComment" ADD CONSTRAINT "PlaylistComment_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListComment" ADD CONSTRAINT "AlbumListComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumListComment" ADD CONSTRAINT "AlbumListComment_albumListId_fkey" FOREIGN KEY ("albumListId") REFERENCES "AlbumList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
