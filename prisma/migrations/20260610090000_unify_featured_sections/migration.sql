-- Create unified featured section tables.
CREATE TABLE IF NOT EXISTS "FeaturedSection" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeaturedItem" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "kind" "FeedKind" NOT NULL,
    "refId" UUID NOT NULL,
    "setByUserId" UUID,
    "note" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeaturedSection_key_key" ON "FeaturedSection"("key");

-- Backfill unified sections from legacy playlist/album-list sections by shared key.
WITH legacy_sections AS (
    SELECT
        "key",
        "name",
        "description",
        "isActive",
        "priority",
        "createdAt",
        "updatedAt",
        0 AS source_order
    FROM "FeaturedPlaylistSection"
    UNION ALL
    SELECT
        "key",
        "name",
        "description",
        "isActive",
        "priority",
        "createdAt",
        "updatedAt",
        1 AS source_order
    FROM "FeaturedAlbumListSection"
),
deduped_sections AS (
    SELECT DISTINCT ON ("key")
        ('00000000-0000-0000-0000-' || substr(md5("key"), 1, 12))::uuid AS "id",
        "key",
        "name",
        "description",
        "isActive",
        "priority",
        "createdAt",
        "updatedAt"
    FROM legacy_sections
    ORDER BY "key", source_order, "priority" ASC, "createdAt" ASC
)
INSERT INTO "FeaturedSection" ("id", "key", "name", "description", "isActive", "priority", "createdAt", "updatedAt")
SELECT "id", "key", "name", "description", "isActive", "priority", "createdAt", "updatedAt"
FROM deduped_sections
ON CONFLICT ("key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = COALESCE("FeaturedSection"."description", EXCLUDED."description"),
    "isActive" = "FeaturedSection"."isActive" OR EXCLUDED."isActive",
    "priority" = LEAST("FeaturedSection"."priority", EXCLUDED."priority"),
    "updatedAt" = CURRENT_TIMESTAMP;

-- Backfill featured playlist and album-list items into the unified item table.
INSERT INTO "FeaturedItem" (
    "id",
    "sectionId",
    "kind",
    "refId",
    "setByUserId",
    "note",
    "priority",
    "isActive",
    "startsAt",
    "endsAt",
    "createdAt",
    "updatedAt"
)
SELECT
    fp."id",
    fs."id",
    'PLAYLIST'::"FeedKind",
    fp."playlistId",
    fp."setByUserId",
    fp."note",
    fp."priority",
    fp."isActive",
    fp."startsAt",
    fp."endsAt",
    fp."createdAt",
    fp."updatedAt"
FROM "FeaturedPlaylist" fp
JOIN "FeaturedPlaylistSection" fps ON fps."id" = fp."sectionId"
JOIN "FeaturedSection" fs ON fs."key" = fps."key"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "FeaturedItem" (
    "id",
    "sectionId",
    "kind",
    "refId",
    "setByUserId",
    "note",
    "priority",
    "isActive",
    "startsAt",
    "endsAt",
    "createdAt",
    "updatedAt"
)
SELECT
    fa."id",
    fs."id",
    'ALBUM_LIST'::"FeedKind",
    fa."albumListId",
    fa."setByUserId",
    fa."note",
    fa."priority",
    fa."isActive",
    fa."startsAt",
    fa."endsAt",
    fa."createdAt",
    fa."updatedAt"
FROM "FeaturedAlbumList" fa
JOIN "FeaturedAlbumListSection" fas ON fas."id" = fa."sectionId"
JOIN "FeaturedSection" fs ON fs."key" = fas."key"
ON CONFLICT ("id") DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS "FeaturedItem_sectionId_kind_refId_key" ON "FeaturedItem"("sectionId", "kind", "refId");
CREATE INDEX IF NOT EXISTS "FeaturedSection_isActive_priority_createdAt_idx" ON "FeaturedSection"("isActive", "priority", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "FeaturedItem_sectionId_isActive_priority_createdAt_idx" ON "FeaturedItem"("sectionId", "isActive", "priority", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "FeaturedItem_kind_refId_idx" ON "FeaturedItem"("kind", "refId");
CREATE INDEX IF NOT EXISTS "FeaturedItem_startsAt_endsAt_idx" ON "FeaturedItem"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "FeaturedItem_setByUserId_idx" ON "FeaturedItem"("setByUserId");

ALTER TABLE "FeaturedItem" ADD CONSTRAINT "FeaturedItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FeaturedSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeaturedItem" ADD CONSTRAINT "FeaturedItem_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
