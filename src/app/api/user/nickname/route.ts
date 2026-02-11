import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { nickname } = await request.json();

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { nickname },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
            return NextResponse.json({ error: 'Duplicate nickname' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}