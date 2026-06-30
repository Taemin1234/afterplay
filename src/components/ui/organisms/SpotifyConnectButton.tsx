'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// 요청한 권한
const SPOTIFY_SCOPES = [
  'user-read-email',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

interface SpotifyConnectButtonProps {
  isConnected: boolean;
}

export default function SpotifyConnectButton({ isConnected }: SpotifyConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const statusText = useMemo(() => {
    if (isConnected) return 'Spotify 연결됨';
    if (isLoading) return 'Spotify로 이동 중...';
    return 'Spotify 연결하기';
  }, [isConnected, isLoading]);

  const handleConnect = async () => {
    if (isConnected || isLoading) return;

    setIsLoading(true);

    // Supabase 인증 기능
    const supabase = createClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin); // 인증이 끝나고 돌아올 주소
    callbackUrl.searchParams.set('mode', 'spotify-link'); // 일반 로그인이 아니라 spotify 연결로 돌아오기
    callbackUrl.searchParams.set('next', '/mypage?spotify=connected'); // 인증 처리가 끝난 후 이동할 주소

    //linkIdentity : 다른 oauth provider를 연결할 때 사용
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'spotify', // provider
      options: {
        redirectTo: callbackUrl.toString(), // 돌아올 주소
        scopes: SPOTIFY_SCOPES, // 요청 권한
        queryParams: {
          show_dialog: 'true',
        },
      },
    });

    if (error) {
      console.error('spotify link error:', error.message);
      alert('Spotify 연결을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setIsLoading(false);
      return;
    }

    // linkIdentity가 성공하면 data.url에 Spotify 인증 페이지 URL이 들어와 거기로 이동
    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setIsLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isConnected || isLoading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#1DB954]/45 bg-[#1DB954]/10 px-3.5 py-2.5 text-sm font-semibold text-[#1DB954] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1DB954]/70 hover:bg-[#1DB954]/15 disabled:cursor-default disabled:border-[#1DB954]/25 disabled:bg-[#1DB954]/5 disabled:text-[#1DB954]/70 disabled:hover:translate-y-0 sm:w-auto"
    >
      {isConnected ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      <span>{statusText}</span>
    </button>
  );
}
