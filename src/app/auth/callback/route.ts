import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

// next 파라미터를 검증
function toSafeNext(nextParam: string | null): string {
  if (!nextParam) return '/';
  if (!nextParam.startsWith('/')) return '/';
  if (nextParam.startsWith('//')) return '/';
  return nextParam;
}

// redirect URL 생성
function buildRedirect(origin: string, pathname: string, next: string) {
  const url = new URL(pathname, origin);
  if (next !== '/') {
    url.searchParams.set('next', next);
  }
  return url;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code'); // OAuth provider가 넘겨준 인증 코드
  const safeNext = toSafeNext(searchParams.get('next')); // 로그인 후 갈 경로
  const providerError = searchParams.get('error');
  const providerErrorDescription = searchParams.get('error_description');

  if (providerError) {
    const url = buildRedirect(origin, '/auth/login', safeNext);
    url.searchParams.set('error', 'oauth_provider_error');
    url.searchParams.set('detail', providerErrorDescription ?? providerError);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = buildRedirect(origin, '/auth/login', safeNext);
    url.searchParams.set('error', 'oauth_code_missing');
    return NextResponse.redirect(url);
  }

  // code를 session으로 교환
  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  // 인증코드오류, 세션교환실패, user 정보없는 경우 로그인 페이지로 다시 전달
  if (exchangeError || !data.user) {
    const url = buildRedirect(origin, '/auth/login', safeNext);
    url.searchParams.set('error', 'oauth_callback_failed');
    if (exchangeError?.message) {
      url.searchParams.set('detail', exchangeError.message);
    }
    return NextResponse.redirect(url);
  }

  // Supabase Auth user에서 필요한 값 추출
  const { id, email } = data.user;
  const normalizedEmail = email?.trim();

  // DB에 user가 있는지 확인
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nickname: true },
  });

  if (!existingUser) {
    // 이메일이 없으면 로그인 거부
    if (!normalizedEmail) {
      await supabase.auth.signOut();
      const url = buildRedirect(origin, '/auth/login', safeNext);
      url.searchParams.set('error', 'email_not_available');
      return NextResponse.redirect(url);
    }

    // 같은 이메일이 다른 id로 등록되어있다면 차단
    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    // 이미 다른 방식으로 가입된 이메일이면 새계정처럼 못들어오게 함
    if (existingByEmail && existingByEmail.id !== id) {
      await supabase.auth.signOut();
      const url = buildRedirect(origin, '/auth/login', safeNext);
      url.searchParams.set('error', 'email_already_registered');
      return NextResponse.redirect(url);
    }

    await prisma.user.create({
      data: {
        id,
        email: normalizedEmail,
        avatarUrl: null,
        nickname: null,
      },
    });

    return NextResponse.redirect(buildRedirect(origin, '/onboarding', safeNext));
  }

  // 기존 유저지만 nickname이 없으면 온보딩
  if (!existingUser.nickname) {
    return NextResponse.redirect(buildRedirect(origin, '/onboarding', safeNext));
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
