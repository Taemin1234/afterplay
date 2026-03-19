'use client';

import Image from 'next/image';
import { useMemo } from 'react';
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

export default function LoginPage() {
  const searchParams = useSearchParams();
  const safeNext = useMemo(() => toSafeNext(searchParams.get('next')), [searchParams]);
  const errorCode = searchParams.get('error');
  const errorDetail = searchParams.get('detail');
  const loginError = useMemo(() => getLoginErrorMessage(errorCode), [errorCode]);

  function getOAuthQueryParams(provider: 'google' | 'spotify'): Record<string, string> {
    if (provider === 'google') {
      return { prompt: 'select_account' };
    }
    return { show_dialog: 'true' };
  }

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
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#0a0f1c]">
      <div className="w-full max-w-md rounded-2xl border border-[#39ff14]/20 bg-black/40 px-8 py-10 shadow-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            After<span className="text-[#39ff14]">Play</span>
          </h1>
          <p className="text-sm text-gray-400">나만의 플레이리스트를 만들고 공유해보세요.</p>
        </div>

        {loginError ? (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <p>{loginError}</p>
            {errorDetail ? <p className="mt-1 break-words text-xs text-red-200/90">원인: {errorDetail}</p> : null}
          </div>
        ) : null}

        <button
          onClick={() => handleOAuthLogin('google')}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-white text-black font-semibold shadow-sm hover:bg-white/90 transition-colors cursor-pointer"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
            <Image
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width={16}
              height={16}
              className="w-4 h-4"
            />
          </span>
          Google 계정으로 계속하기
        </button>

        <button
          onClick={() => handleOAuthLogin('spotify')}
          className="mt-3 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-[#39ff14] text-black font-semibold shadow-sm hover:bg-[#39ff14]/90 transition-colors cursor-pointer"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[#1DB954] text-xs font-bold">
            S
          </span>
          Spotify 계정으로 계속하기
        </button>

        <p className="mt-4 text-[14px] text-gray-500 text-center">Google 또는 Spotify 인증으로 안전하게 로그인할 수 있어요.</p>
      </div>
    </main>
  );
}
