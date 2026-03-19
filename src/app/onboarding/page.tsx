'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Disc3, Sparkles } from 'lucide-react';

const NICKNAME_MAX_UNITS = 16;

function isKoreanChar(char: string) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(char);
}

function getNicknameUnits(value: string) {
  return Array.from(value).reduce((sum, char) => sum + (isKoreanChar(char) ? 2 : 1), 0);
}

function clampNicknameByUnits(value: string, maxUnits: number) {
  let used = 0;
  let result = '';

  for (const char of Array.from(value)) {
    const next = isKoreanChar(char) ? 2 : 1;
    if (used + next > maxUnits) break;
    result += char;
    used += next;
  }

  return result;
}

function toSafeNext(nextParam: string | null): string {
  if (!nextParam) return '/';
  if (!nextParam.startsWith('/')) return '/';
  if (nextParam.startsWith('//')) return '/';
  return nextParam;
}

export default function OnboardingPage() {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = useMemo(() => toSafeNext(searchParams.get('next')), [searchParams]);
  const nicknameUnits = getNicknameUnits(nickname);

  const getNicknameErrorMessage = (error?: string) => {
    if (error === 'Duplicate nickname') return '이미 사용 중인 닉네임이에요.';
    if (error === 'Nickname is not allowed') return '사용할 수 없는 닉네임이에요. 다른 이름을 입력해주세요.';
    return '닉네임을 저장하지 못했어요. 잠시 후 다시 시도해주세요.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        body: JSON.stringify({ nickname }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        alert('가입을 축하합니다!');
        router.push(safeNext);
      } else {
        const data = await res.json();
        alert(getNicknameErrorMessage(data?.error));
      }
    } catch (error) {
      console.error(error);
      alert('서버에 문제가 있어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6 py-14">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#39ff14]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-[#39ff14]/20 bg-[#0b1224]/85 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-full bg-[#39ff14]/10 p-2">
            <Disc3 className="h-5 w-5 text-[#39ff14]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">너의 닉네임은?</h1>
            <p className="text-xs text-gray-400">사용할 닉네임을 설정해주세요.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="nickname" className="block text-xs font-medium uppercase tracking-wide text-gray-400">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            placeholder="영문 16자 / 한글 8자"
            value={nickname}
            onChange={(e) => setNickname(clampNicknameByUnits(e.target.value, NICKNAME_MAX_UNITS))}
            className="w-full rounded-xl border border-slate-700 bg-[#070d1d] px-4 py-3 text-sm text-white outline-none transition focus:border-[#39ff14]/70 focus:ring-2 focus:ring-[#39ff14]/20"
            required
            minLength={2}
            maxLength={16}
          />

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#39ff14]" />
              영문 16자, 한글 8자까지 입력할 수 있어요.
            </span>
            <span>{nicknameUnits}/{NICKNAME_MAX_UNITS}</span>
          </div>

          <button
            type="submit"
            disabled={loading || nicknameUnits < 2 || nicknameUnits > NICKNAME_MAX_UNITS}
            className="mt-2 w-full rounded-xl bg-[#39ff14] py-3 text-sm font-bold text-black transition hover:bg-[#5cff3a] disabled:cursor-not-allowed disabled:bg-[#39ff14]/35 disabled:text-black/60 cursor-pointer"
          >
            {loading ? '저장중...' : '계속하기'}
          </button>
        </form>
      </div>
    </main>
  );
}

