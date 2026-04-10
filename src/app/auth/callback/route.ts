import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

type LoginErrorCode =
  | 'oauth_provider_error'
  | 'oauth_provider_cancelled'
  | 'oauth_spotify_email_unverified'
  | 'oauth_provider_misconfigured'
  | 'oauth_provider_unavailable'
  | 'oauth_rate_limited'
  | 'oauth_network_error'
  | 'oauth_code_missing'
  | 'oauth_code_invalid'
  | 'oauth_state_invalid'
  | 'oauth_callback_failed'
  | 'email_not_available'
  | 'email_already_registered';

function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  return value.split(',')[0]?.trim() ?? null;
}

function resolveRequestOrigin(request: Request): string {
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const host = forwardedHost ?? firstHeaderValue(request.headers.get('host'));

  if (host) {
    const protocol = forwardedProto ?? 'https';
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

function toErrorText(value: string | null | undefined): string {
  return (value ?? '').toLowerCase();
}

function classifyProviderError(providerError: string, detail: string | null): LoginErrorCode {
  const combined = `${providerError} ${detail ?? ''}`.toLowerCase();

  if (combined.includes('access_denied') || combined.includes('user denied')) return 'oauth_provider_cancelled';
  if (combined.includes('unverified email with spotify')) return 'oauth_spotify_email_unverified';
  if (combined.includes('redirect_uri') || combined.includes('redirect url')) return 'oauth_provider_misconfigured';
  if (combined.includes('provider is not enabled') || combined.includes('unsupported provider')) return 'oauth_provider_unavailable';
  if (combined.includes('rate limit') || combined.includes('too many requests')) return 'oauth_rate_limited';
  if (combined.includes('failed to fetch') || combined.includes('network') || combined.includes('timeout')) return 'oauth_network_error';

  return 'oauth_provider_error';
}

function classifyExchangeError(detail: string | null): LoginErrorCode {
  const normalized = toErrorText(detail);

  if (normalized.includes('unverified email with spotify')) return 'oauth_spotify_email_unverified';
  if (normalized.includes('invalid_grant') || normalized.includes('authorization code') || normalized.includes('code verifier')) {
    return 'oauth_code_invalid';
  }
  if (normalized.includes('bad oauth state') || normalized.includes('state')) return 'oauth_state_invalid';
  if (normalized.includes('redirect_uri') || normalized.includes('redirect url')) return 'oauth_provider_misconfigured';
  if (normalized.includes('provider is not enabled') || normalized.includes('unsupported provider')) return 'oauth_provider_unavailable';
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) return 'oauth_rate_limited';
  if (normalized.includes('failed to fetch') || normalized.includes('network') || normalized.includes('timeout')) return 'oauth_network_error';

  return 'oauth_callback_failed';
}

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

function redirectToLoginWithError(origin: string, next: string, code: LoginErrorCode, detail?: string | null) {
  const url = buildRedirect(origin, '/auth/login', next);
  url.searchParams.set('error', code);
  if (detail && process.env.NODE_ENV !== 'production') {
    url.searchParams.set('detail', detail);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = resolveRequestOrigin(request);
  const code = searchParams.get('code'); // OAuth provider가 넘겨준 인증 코드
  const safeNext = toSafeNext(searchParams.get('next')); // 로그인 후 갈 경로
  const providerError = searchParams.get('error');
  const providerErrorDescription = searchParams.get('error_description');

  if (providerError) {
    const errorCode = classifyProviderError(providerError, providerErrorDescription);
    return redirectToLoginWithError(origin, safeNext, errorCode, providerErrorDescription ?? providerError);
  }

  if (!code) {
    return redirectToLoginWithError(origin, safeNext, 'oauth_code_missing');
  }

  // code를 session으로 교환
  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  // 인증코드오류, 세션교환실패, user 정보없는 경우 로그인 페이지로 다시 전달
  if (exchangeError || !data.user) {
    const detail = exchangeError?.message ?? null;
    const errorCode = classifyExchangeError(detail);
    return redirectToLoginWithError(origin, safeNext, errorCode, detail);
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
      return redirectToLoginWithError(origin, safeNext, 'email_not_available');
    }

    // 같은 이메일이 다른 id로 등록되어있다면 차단
    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    // 이미 다른 방식으로 가입된 이메일이면 새계정처럼 못들어오게 함
    if (existingByEmail && existingByEmail.id !== id) {
      await supabase.auth.signOut();
      return redirectToLoginWithError(origin, safeNext, 'email_already_registered');
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
