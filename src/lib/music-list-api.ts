import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export type VisibilityValue = 'PUBLIC' | 'PRIVATE';
export type ListEntityType = 'track' | 'album';

export interface MusicItemPayload {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
}

export interface ListPayloadInput {
  title?: string;
  story?: string;
  visibility?: VisibilityValue;
  type?: ListEntityType;
  musicItems?: MusicItemPayload[];
  tags?: string[];
}

export interface NormalizedListPayload {
  title: string;
  story: string;
  visibility: VisibilityValue;
  musicItems: MusicItemPayload[];
  tags: string[];
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function upsertDbUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: { avatar_url?: string | null } | null;
}) {
  const email = user.email?.trim();
  if (!email) return;

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    create: {
      id: user.id,
      email,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
      nickname: null,
    },
  });
}

export function cleanTags(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 10);
}

export function uniqueMusicItems(musicItems: MusicItemPayload[]): MusicItemPayload[] {
  return Array.from(new Map(musicItems.map((item) => [item.id, item])).values());
}

export async function upsertTags(tags: string[]) {
  if (tags.length === 0) return [];
  return Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true },
      })
    )
  );
}

export function validateAndNormalizeListPayload(
  body: ListPayloadInput,
  options: { expectedType: ListEntityType; requireType: boolean }
): { data?: NormalizedListPayload; error?: string } {
  const title = body.title?.trim();
  const story = body.story?.trim();

  if (!title || !story) {
    return { error: 'title/story is required' };
  }
  if (!Array.isArray(body.musicItems) || body.musicItems.length === 0) {
    return { error: 'musicItems is required' };
  }

  if (options.requireType) {
    if (body.type !== options.expectedType) {
      return { error: `${options.expectedType} type is required` };
    }
  } else if (body.type && body.type !== options.expectedType) {
    return { error: `type must be ${options.expectedType}` };
  }

  if (body.visibility !== 'PUBLIC' && body.visibility !== 'PRIVATE') {
    return { error: 'invalid visibility' };
  }

  return {
    data: {
      title,
      story,
      visibility: body.visibility,
      musicItems: uniqueMusicItems(body.musicItems),
      tags: cleanTags(body.tags),
    },
  };
}
