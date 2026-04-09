'use client';

import Image from 'next/image';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { createClient } from '@/utils/supabase/client';

function toSafeNext(nextParam: string | null): string {
  if (!nextParam) return '/';
  if (!nextParam.startsWith('/')) return '/';
  if (nextParam.startsWith('//')) return '/';
  return nextParam;
}

function getLoginErrorMessage(code: string | null): string | null {
  if (code === 'oauth_provider_error') return '소셜 로그인 제공자에서 인증을 완료하지 못했습니다.';
  if (code === 'oauth_code_missing') return '인증 코드가 전달되지 않았습니다. 다시 로그인해주세요.';
  if (code === 'oauth_callback_failed') return '로그인 세션 생성에 실패했습니다. 다시 시도해주세요.';
  if (code === 'email_not_available') return '이 소셜 계정에서 이메일을 확인할 수 없습니다. 다른 계정으로 시도해주세요.';
  if (code === 'email_already_registered') return '이미 다른 로그인 방식으로 가입된 이메일입니다. 기존 방식으로 로그인해주세요.';
  return null;
}

function getOAuthQueryParams(provider: 'google' | 'spotify'): Record<string, string> {
  if (provider === 'google') {
    return { prompt: 'select_account' };
  }
  return { show_dialog: 'true' };
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const safeNext = useMemo(() => toSafeNext(searchParams.get('next')), [searchParams]);

  const errorCode = searchParams.get('error');
  const errorDetail = searchParams.get('detail');
  const loginError = useMemo(() => getLoginErrorMessage(errorCode), [errorCode]);

  const handleOAuthLogin = async (provider: 'google' | 'spotify') => {
    const supabase = createClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin);

    if (safeNext !== '/') {
      callbackUrl.searchParams.set('next', safeNext);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: getOAuthQueryParams(provider),
      },
    });

    if (error) {
      console.error(`${provider} login error:`, error.message);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <main className='min-h-screen bg-[#0a0f1c] px-4 py-8 sm:px-6 sm:py-10'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[22rem] items-center sm:max-w-md'>
        <div className='w-full rounded-xl border border-[#39ff14]/20 bg-black/40 px-5 py-7 shadow-xl sm:rounded-2xl sm:px-8 sm:py-10'>
          <div className='mb-6 sm:mb-8'>
            <h1 className='mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl'>
              After<span className='text-[#39ff14]'>Play</span>
            </h1>
            <p className='text-xs text-gray-400 sm:text-sm'>나만의 플레이리스트를 만들고 공유해보세요.</p>
          </div>

          {loginError ? (
            <div className='mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200'>
              <p>{loginError}</p>
              {errorDetail ? <p className='mt-1 break-words text-xs text-red-200/90'>원인: {errorDetail}</p> : null}
            </div>
          ) : null}

          <button
            onClick={() => handleOAuthLogin('google')}
            className='flex w-full items-center justify-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-white/90 sm:py-3 sm:text-base'
          >
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-white sm:h-7 sm:w-7'>
              <Image src='https://www.google.com/favicon.ico' alt='Google' width={16} height={16} className='h-4 w-4' />
            </span>
            Google 계정으로 계속하기
          </button>

          <button
            onClick={() => handleOAuthLogin('spotify')}
            className='mt-3 flex w-full items-center justify-center gap-3 rounded-full bg-[#39ff14] px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-[#39ff14]/90 sm:py-3 sm:text-base'
          >
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-[#1DB954] sm:h-7 sm:w-7'>
              S
            </span>
            Spotify 계정으로 계속하기
          </button>

          <p className='mt-4 text-center text-xs text-gray-500 break-keep sm:text-sm'>Google 또는 Spotify 인증으로 안전하게 로그인할 수 있어요.</p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
