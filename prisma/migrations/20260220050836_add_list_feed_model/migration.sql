-- CreateEnum
CREATE TYPE "FeedKind" AS ENUM ('PLAYLIST', 'ALBUM_LIST');

-- CreateTable
CREATE TABLE "ListFeed" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "FeedKind" NOT NULL,
    "refId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListFeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListFeed_userId_createdAt_id_idx" ON "ListFeed"("userId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "ListFeed_kind_refId_idx" ON "ListFeed"("kind", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "ListFeed_userId_kind_refId_key" ON "ListFeed"("userId", "kind", "refId");
