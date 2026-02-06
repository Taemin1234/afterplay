import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // OAuth 콜백에서 오는 “인증 코드” (OAuth 표준)
  const code = searchParams.get('code');
  // 로그인 성공 후 보낼 페이지 (기본값은 메인)
  // const next = searchParams.get('next') ?? '/';

  if (code) {
    // 1. 서버 전용 Supabase 클라이언트 생성(쿠키 연결)
    const supabase = await createSupabaseServerClient();

    // 2. 인증 코드를 세션(쿠키)으로 교환
    // 이 과정에서 로그인이 완료되고 쿠키가 자동으로 구워집니다.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { id, email, user_metadata } = data.user;

      // 3. Prisma를 사용하여 우리 DB(User 테이블)에 정보 동기화
      const existingUser = await prisma.user.findUnique({
        where: { id: id }, // Supabase Auth의 UUID
      });

      // 신규 유저 등록
      if (!existingUser) {
        await prisma.user.upsert({
            where: { id },
            update: { email: email ?? "", avatarUrl: user_metadata.avatar_url ?? null },
            create: { id, email: email ?? "", avatarUrl: user_metadata.avatar_url ?? null, nickname: null },
        });
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // 기존 유저인데 닉네임이 아직 없는 경우 처리
      if (!existingUser.nickname) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  // 4. 모든 과정이 끝나면 지정된 페이지나 메인으로 이동
  return NextResponse.redirect(`${origin}`);
}