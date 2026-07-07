-- CreateEnum
CREATE TYPE "PollItemType" AS ENUM ('TRACK', 'ALBUM');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "MusicPoll" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "itemType" "PollItemType" NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'OPEN',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MusicPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicPollOption" (
    "id" UUID NOT NULL,
    "pollId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "trackId" UUID,
    "albumId" UUID,
    "spotifyId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "artistSnapshot" TEXT NOT NULL,
    "imageUrlSnapshot" TEXT NOT NULL,
    "releaseDateSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicPollOption_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MusicPollOption_order_check" CHECK ("order" IN (0, 1)),
    CONSTRAINT "MusicPollOption_target_check" CHECK (
        ("trackId" IS NOT NULL AND "albumId" IS NULL)
        OR ("trackId" IS NULL AND "albumId" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "MusicPollVote" (
    "id" UUID NOT NULL,
    "pollId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicPollComment" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "pollId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MusicPollComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MusicPoll_status_startsAt_endsAt_idx" ON "MusicPoll"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "MusicPoll_createdAt_idx" ON "MusicPoll"("createdAt");

-- CreateIndex
CREATE INDEX "MusicPoll_deletedAt_idx" ON "MusicPoll"("deletedAt");

-- CreateIndex
CREATE INDEX "MusicPoll_createdById_idx" ON "MusicPoll"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "MusicPollOption_pollId_order_key" ON "MusicPollOption"("pollId", "order");

-- CreateIndex
CREATE INDEX "MusicPollOption_pollId_idx" ON "MusicPollOption"("pollId");

-- CreateIndex
CREATE INDEX "MusicPollOption_trackId_idx" ON "MusicPollOption"("trackId");

-- CreateIndex
CREATE INDEX "MusicPollOption_albumId_idx" ON "MusicPollOption"("albumId");

-- CreateIndex
CREATE INDEX "MusicPollOption_titleSnapshot_idx" ON "MusicPollOption"("titleSnapshot");

-- CreateIndex
CREATE UNIQUE INDEX "MusicPollVote_pollId_userId_key" ON "MusicPollVote"("pollId", "userId");

-- CreateIndex
CREATE INDEX "MusicPollVote_pollId_optionId_idx" ON "MusicPollVote"("pollId", "optionId");

-- CreateIndex
CREATE INDEX "MusicPollVote_optionId_idx" ON "MusicPollVote"("optionId");

-- CreateIndex
CREATE INDEX "MusicPollVote_userId_idx" ON "MusicPollVote"("userId");

-- CreateIndex
CREATE INDEX "MusicPollComment_pollId_createdAt_idx" ON "MusicPollComment"("pollId", "createdAt");

-- CreateIndex
CREATE INDEX "MusicPollComment_userId_idx" ON "MusicPollComment"("userId");

-- AddForeignKey
ALTER TABLE "MusicPoll" ADD CONSTRAINT "MusicPoll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollOption" ADD CONSTRAINT "MusicPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "MusicPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollOption" ADD CONSTRAINT "MusicPollOption_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollOption" ADD CONSTRAINT "MusicPollOption_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollVote" ADD CONSTRAINT "MusicPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "MusicPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollVote" ADD CONSTRAINT "MusicPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MusicPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollVote" ADD CONSTRAINT "MusicPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollComment" ADD CONSTRAINT "MusicPollComment_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "MusicPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPollComment" ADD CONSTRAINT "MusicPollComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
