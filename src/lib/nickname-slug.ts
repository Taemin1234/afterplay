import prisma from '@/lib/prisma';

// 금칙어
const RESERVED_WORDS = new Set([
  'admin',
  'afterplay',
  'dustpeakclub',
  'api',
  'auth',
  'callback',
  'createlist',
  'login',
  'mypage',
  'onboarding',
  'playlist',
  'albumlist',
  'profile',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 공백, 하이픈, 언더스코어 제거하고 소문자로 변환
function normalizeNicknameForPolicy(nickname: string): string {
  return nickname
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^\p{Letter}\p{Number}]/gu, '');
}

// 사용자가 입력한 닉네임이 금칙어인지 확인
export function isReservedNickname(nickname: string): boolean {
  const normalized = normalizeNicknameForPolicy(nickname);
  return normalized.length > 0 && RESERVED_WORDS.has(normalized);
}


// URL에 들어갈 slug의 기본 형태를 만드는 함수
export function normalizeNicknameToSlugBase(nickname: string): string {
  const compact = nickname.trim().toLowerCase().replace(/\s+/g, '');
  const safe = compact.replace(/[^\p{Letter}\p{Number}_-]/gu, '');
  const base = safe.slice(0, 30);

  if (!base) return 'user';

  const normalizedBase = normalizeNicknameForPolicy(base);
  if (normalizedBase && RESERVED_WORDS.has(normalizedBase)) {
    return `${base}-user`;
  }

  return base;
}

// 중복이라면 숫자 붙여서 고유성 확보
export async function generateUniqueNicknameSlug(
  nickname: string,
  options?: { excludeUserId?: string }
): Promise<string> {
  const base = normalizeNicknameToSlugBase(nickname);

  const where = options?.excludeUserId
    ? {
      nicknameSlug: { startsWith: base },
      id: { not: options.excludeUserId },
    }
    : {
      nicknameSlug: { startsWith: base },
    };

  const existing = await prisma.user.findMany({
    where,
    select: { nicknameSlug: true },
  });

  const existingSlugs = new Set(
    existing.map((user) => user.nicknameSlug).filter((slug): slug is string => Boolean(slug))
  );

  if (!existingSlugs.has(base)) return base;

  const suffixPattern = new RegExp(`^${escapeRegExp(base)}-(\\d+)$`);
  let maxSuffix = 1;

  for (const slug of existingSlugs) {
    const match = suffixPattern.exec(slug);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isInteger(value) && value > maxSuffix) {
      maxSuffix = value;
    }
  }

  return `${base}-${maxSuffix + 1}`;
}
