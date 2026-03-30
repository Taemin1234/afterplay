-- Add enum values
DO $$
BEGIN
  ALTER TYPE "FeedKind" ADD VALUE 'ARTIST_LIST';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  ALTER TYPE "MusicAliasType" ADD VALUE 'ARTIST_NAME';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "ArtistList" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ArtistList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" UUID NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistEntry" (
    "id" UUID NOT NULL,
    "artistListId" UUID NOT NULL,
    "artistId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistListTag" (
    "artistListId" UUID NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ArtistListTag_pkey" PRIMARY KEY ("artistListId","tagId")
);

-- CreateTable
CREATE TABLE "ArtistListLike" (
    "userId" UUID NOT NULL,
    "artistListId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistListLike_pkey" PRIMARY KEY ("userId","artistListId")
);

-- CreateTable
CREATE TABLE "ArtistListBookmark" (
    "userId" UUID NOT NULL,
    "artistListId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistListBookmark_pkey" PRIMARY KEY ("userId","artistListId")
);

-- CreateTable
CREATE TABLE "ArtistListViewEvent" (
    "id" UUID NOT NULL,
    "artistListId" UUID NOT NULL,
    "userId" UUID,
    "deviceId" TEXT,
    "lastCountedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistListViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistListComment" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "artistListId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ArtistListComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedArtistListSection" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedArtistListSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedArtistList" (
    "id" UUID NOT NULL,
    "artistListId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "setByUserId" UUID,
    "note" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedArtistList_pkey" PRIMARY KEY ("id")
);

-- Seed default section for artist list recommendations
INSERT INTO "FeaturedArtistListSection" ("id", "key", "name", "isActive", "priority", "createdAt", "updatedAt")
VALUES ('33333333-3333-3333-3333-333333333333', 'featured', 'Featured', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- CreateIndex
CREATE INDEX "ArtistList_authorId_idx" ON "ArtistList"("authorId");
CREATE INDEX "ArtistList_createdAt_idx" ON "ArtistList"("createdAt");
CREATE INDEX "ArtistList_visibility_idx" ON "ArtistList"("visibility");

CREATE UNIQUE INDEX "Artist_spotifyId_key" ON "Artist"("spotifyId");

CREATE UNIQUE INDEX "ArtistEntry_artistListId_order_key" ON "ArtistEntry"("artistListId", "order");
CREATE UNIQUE INDEX "ArtistEntry_artistListId_artistId_key" ON "ArtistEntry"("artistListId", "artistId");
CREATE INDEX "ArtistEntry_artistListId_idx" ON "ArtistEntry"("artistListId");
CREATE INDEX "ArtistEntry_artistId_idx" ON "ArtistEntry"("artistId");

CREATE INDEX "ArtistListTag_tagId_idx" ON "ArtistListTag"("tagId");
CREATE INDEX "ArtistListLike_artistListId_idx" ON "ArtistListLike"("artistListId");
CREATE INDEX "ArtistListBookmark_artistListId_idx" ON "ArtistListBookmark"("artistListId");

CREATE INDEX "ArtistListViewEvent_artistListId_lastCountedAt_idx" ON "ArtistListViewEvent"("artistListId", "lastCountedAt");
CREATE INDEX "ArtistListViewEvent_userId_idx" ON "ArtistListViewEvent"("userId");
CREATE INDEX "ArtistListViewEvent_deviceId_idx" ON "ArtistListViewEvent"("deviceId");
CREATE UNIQUE INDEX "ArtistListViewEvent_artistListId_userId_key" ON "ArtistListViewEvent"("artistListId", "userId");
CREATE UNIQUE INDEX "ArtistListViewEvent_artistListId_deviceId_key" ON "ArtistListViewEvent"("artistListId", "deviceId");

CREATE INDEX "ArtistListComment_artistListId_createdAt_idx" ON "ArtistListComment"("artistListId", "createdAt");
CREATE INDEX "ArtistListComment_userId_idx" ON "ArtistListComment"("userId");

CREATE UNIQUE INDEX "FeaturedArtistListSection_key_key" ON "FeaturedArtistListSection"("key");
CREATE INDEX "FeaturedArtistListSection_isActive_priority_createdAt_idx" ON "FeaturedArtistListSection"("isActive", "priority", "createdAt" DESC);

CREATE UNIQUE INDEX "FeaturedArtistList_artistListId_sectionId_key" ON "FeaturedArtistList"("artistListId", "sectionId");
CREATE INDEX "FeaturedArtistList_sectionId_isActive_priority_createdAt_idx" ON "FeaturedArtistList"("sectionId", "isActive", "priority", "createdAt" DESC);
CREATE INDEX "FeaturedArtistList_startsAt_endsAt_idx" ON "FeaturedArtistList"("startsAt", "endsAt");
CREATE INDEX "FeaturedArtistList_setByUserId_idx" ON "FeaturedArtistList"("setByUserId");

-- AddForeignKey
ALTER TABLE "ArtistList" ADD CONSTRAINT "ArtistList_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ArtistEntry" ADD CONSTRAINT "ArtistEntry_artistListId_fkey" FOREIGN KEY ("artistListId") REFERENCES "ArtistList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistEntry" ADD CONSTRAINT "ArtistEntry_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ArtistListTag" ADD CONSTRAINT "ArtistListTag_artistListId_fkey" FOREIGN KEY ("artistListId") REFERENCES "ArtistList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistListTag" ADD CONSTRAINT "ArtistListTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtistListLike" ADD CONSTRAINT "ArtistListLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistListLike" ADD CONSTRAINT "ArtistListLike_artistListId_fkey" FOREIGN KEY ("artistListId") REFERENCES "ArtistList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtistListBookmark" ADD CONSTRAINT "ArtistListBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistListBookmark" ADD CONSTRAINT "ArtistListBookmark_artistListId_fkey" FOREIGN KEY ("artistListId") REFERENCES "ArtistList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtistListViewEvent" ADD CONSTRAINT "ArtistListViewEvent_artistListId_fkey" FOREIGN KEY ("artistListId") REFERENCES "ArtistList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistListViewEvent" ADD CONSTRAINT "ArtistListViewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtistListComment" ADD CONSTRAINT "ArtistListComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistListComment" ADD CONSTRAINT "ArtistListComment_artistListId_fkey" FOREIGN KEY ("artistListId") REFERENCES "ArtistList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeaturedArtistList" ADD CONSTRAINT "FeaturedArtistList_artistListId_fkey" FOREIGN KEY ("artistListId") REFERENCES "ArtistList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeaturedArtistList" ADD CONSTRAINT "FeaturedArtistList_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FeaturedArtistListSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeaturedArtistList" ADD CONSTRAINT "FeaturedArtistList_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

