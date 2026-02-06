'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        alert('환영합니다! 가입이 완료되었습니다.');
        router.push('/'); // 메인 페이지로 이동
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('서버 통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">환영합니다! 👋</h2>
        <p className="text-gray-500 mb-8">afterplay에서 사용할 멋진 닉네임을 정해주세요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="닉네임 입력 (2~10자)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
            minLength={2}
            maxLength={10}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-all"
          >
            {loading ? '처리 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </main>
  );
}