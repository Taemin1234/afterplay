INSERT INTO "FeaturedSection" (
    "id",
    "key",
    "name",
    "description",
    "isActive",
    "priority",
    "createdAt",
    "updatedAt"
)
VALUES (
    '33333333-3333-4333-8333-333333333333',
    'weekly-new-releases',
    '이주의 신곡',
    '관리자가 선정한 이주의 신곡 게시물',
    true,
    10,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;
