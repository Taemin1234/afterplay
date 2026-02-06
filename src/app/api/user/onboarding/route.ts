import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증되지 않은 유저입니다.' }, { status: 401 });
  }

  const { nickname } = await request.json();

  try {
    // Prisma로 유저의 닉네임 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { nickname },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // 중복된 닉네임 에러 처리 (P2002는 Prisma의 유니크 제약조건 에러 코드)
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'DB 업데이트 실패' }, { status: 500 });
  }
}