ALTER TABLE "MusicPoll"
ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC';

CREATE INDEX "MusicPoll_visibility_deletedAt_createdAt_idx"
ON "MusicPoll"("visibility", "deletedAt", "createdAt" DESC);
