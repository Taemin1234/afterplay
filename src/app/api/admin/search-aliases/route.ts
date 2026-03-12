import { NextResponse } from 'next/server';

import { getAdminUserOrNull } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

type CreateAliasBody = {
  type?: 'TRACK_ARTIST' | 'TRACK_TITLE' | 'ALBUM_ARTIST' | 'ALBUM_TITLE';
  canonical?: string;
  alias?: string;
};

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

export async function GET() {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await prisma.musicSearchAlias.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 300,
    });

    return NextResponse.json({ items: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch aliases';
    console.error('[admin/search-aliases][GET]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as CreateAliasBody;

    const type = body.type;
    const canonical = normalizeText(body.canonical);
    const alias = normalizeText(body.alias);

    if (!type || !['TRACK_ARTIST', 'TRACK_TITLE', 'ALBUM_ARTIST', 'ALBUM_TITLE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (canonical.length < 1 || alias.length < 1) {
      return NextResponse.json({ error: '항목을 채워주세요' }, { status: 400 });
    }

    if (canonical.toLowerCase() === alias.toLowerCase()) {
      return NextResponse.json({ error: '원본과 별칭은 달라야합니다.' }, { status: 400 });
    }

    const created = await prisma.musicSearchAlias.create({
      data: {
        type,
        canonical,
        alias,
      },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create alias';
    const isDuplicate = message.toLowerCase().includes('unique');
    console.error('[admin/search-aliases][POST]', error);
    return NextResponse.json({ error: isDuplicate ? 'Duplicate alias' : message }, { status: isDuplicate ? 409 : 500 });
  }
}
