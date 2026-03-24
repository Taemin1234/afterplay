'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/ui/atoms/Button';
import { createClient } from '@/utils/supabase/client';

type DeleteResponse = {
  success?: boolean;
  error?: string;
  detail?: {
    message?: string;
    code?: string | null;
  };
};

export default function AccountDeletionButton() {
  const router = useRouter();
  // 중복클릭 방지
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    const firstConfirm = window.confirm(
      `정말로 탈퇴하시겠습니까?`
    );
    if (!firstConfirm) return;

    const typed = window.prompt("확인을 위해 '탈퇴'를 입력해 주세요.");
    if (typed !== '탈퇴') {
      alert('탈퇴 문구가 일치하지 않습니다.');
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      const data = (await res.json()) as DeleteResponse;
      if (!res.ok) {
        const detailText = data.detail?.code
          ? `${data.detail.message ?? 'Unknown'} (${data.detail.code})`
          : data.detail?.message;
        throw new Error(detailText ? `${data.error ?? '삭제실패'}: ${detailText}` : (data.error ?? '삭제실패'));
      }

      const supabase = createClient();
      await supabase.auth.signOut();

      alert('회원탈퇴가 완료되었습니다. 돌아올 날을 기다리고 있겠습니다.');
      router.replace('/'); // 뒤로가기 방지
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '회원탈퇴 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleDeleteAccount}
      disabled={isDeleting}
      className="w-full justify-center sm:w-auto sm:mt-0"
    >
      {isDeleting ? '처리 중...' : '회원탈퇴'}
    </Button>
  );
}
