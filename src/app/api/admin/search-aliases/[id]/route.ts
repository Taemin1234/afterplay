import { NextResponse } from 'next/server';

import { getAdminUserOrNull } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

type UpdateAliasBody = {
  canonical?: string;
  alias?: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const aliasId = Number(id);

    if (!Number.isInteger(aliasId) || aliasId < 1) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = (await request.json()) as UpdateAliasBody;
    const canonical = normalizeText(body.canonical);
    const alias = normalizeText(body.alias);

    if (!canonical || !alias) {
      return NextResponse.json({ error: 'canonical/alias is required' }, { status: 400 });
    }

    if (canonical.toLowerCase() === alias.toLowerCase()) {
      return NextResponse.json({ error: 'canonical and alias must be different' }, { status: 400 });
    }

    const existing = await prisma.musicSearchAlias.findUnique({ where: { id: aliasId } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.musicSearchAlias.update({
      where: { id: aliasId },
      data: {
        canonical,
        alias,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update alias';
    const isDuplicate = message.toLowerCase().includes('unique');
    console.error('[admin/search-aliases/:id][PATCH]', error);
    return NextResponse.json({ error: isDuplicate ? 'Duplicate alias' : message }, { status: isDuplicate ? 409 : 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const aliasId = Number(id);

    if (!Number.isInteger(aliasId) || aliasId < 1) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await prisma.musicSearchAlias.deleteMany({ where: { id: aliasId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete alias';
    console.error('[admin/search-aliases/:id][DELETE]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
