'use client';

import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 로그인 성공 후 돌아올 주소 (환경변수로 관리)
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('로그인 에러:', error.message);
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
          <p className="text-sm text-gray-400">
            당신만의 플레이리스트를 만들고 공유해 보세요.
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-[#39ff14] text-black font-semibold shadow-sm hover:bg-[#39ff14]/90 transition-colors cursor-pointer"
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
          구글 계정으로 계속하기
        </button>

        <p className="mt-4 text-[14px] text-gray-500 text-center">
          Google 인증을 통해 안전하게 로그인할 수 있어요.
        </p>
      </div>
    </main>
  );
}