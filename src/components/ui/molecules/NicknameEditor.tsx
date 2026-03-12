'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import Input from '@/components/ui/atoms/Input';
import IconButton from '@/components/ui/atoms/IconButton';

interface NicknameEditorProps {
  initialNickname: string;
  isOwner?: boolean;
}

type UpdateNicknameResponse = {
  success?: boolean;
  nicknameSlug?: string;
  error?: string;
};

function getNicknameErrorMessage(error?: string) {
  if (error === 'Duplicate nickname') return '이미 사용 중인 닉네임이에요.';
  if (error === 'Nickname is not allowed') return '사용할 수 없는 닉네임이에요. 다른 이름을 입력해주세요.';
  return '닉네임을 변경하지 못했어요. 잠시 후 다시 시도해주세요.';
}

export default function NicknameEditor({ initialNickname, isOwner = false }: NicknameEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(initialNickname);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (nickname === initialNickname) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/nickname', {
        method: 'PATCH',
        body: JSON.stringify({ nickname }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = (await res.json().catch(() => ({}))) as UpdateNicknameResponse;

      if (res.ok) {
        setIsEditing(false);

        if (pathname.startsWith('/profile/') && data.nicknameSlug) {
          router.replace(`/profile/${encodeURIComponent(data.nicknameSlug)}`);
          router.refresh();
          return;
        }

        window.location.reload();
        return;
      }

      alert(getNicknameErrorMessage(data?.error));
    } catch (error) {
      console.error(error);
      alert('서버에 문제가 있어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      {isEditing ? (
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Input
            variant="form"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력해주세요."
            className="w-36 sm:w-44"
          />
          <IconButton
            icon={<Check className="text-neon-green" size={20} />}
            onClick={handleUpdate}
            disabled={isLoading}
          />
          <IconButton
            icon={<X className="text-gray-500" size={20} />}
            onClick={() => {
              setNickname(initialNickname);
              setIsEditing(false);
            }}
          />
        </div>
      ) : (
        <>
          <p className="truncate text-base font-bold text-white sm:text-lg md:text-2xl">{nickname}</p>
          {isOwner && <IconButton icon={<Pencil className='h-3.5 w-3.5 sm:h-4 sm:w-4' />} onClick={() => setIsEditing(true)} />}
        </>
      )}
    </div>
  );
}
