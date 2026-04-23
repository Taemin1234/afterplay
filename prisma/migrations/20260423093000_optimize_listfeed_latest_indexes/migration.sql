-- Optimize global latest feed scans for /api/music/lists?type=all&sort=latest
CREATE INDEX IF NOT EXISTS "ListFeed_createdAt_id_desc_idx"
ON "ListFeed"("createdAt" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "ListFeed_kind_createdAt_id_desc_idx"
ON "ListFeed"("kind", "createdAt" DESC, "id" DESC);
