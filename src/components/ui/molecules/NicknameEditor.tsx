'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import Input from '@/components/ui/atoms/Input';
import IconButton from '@/components/ui/atoms/IconButton';

interface NicknameEditorProps {
  initialNickname: string;
  isOwner?: boolean;
  onNicknameChange?: (nickname: string) => void;
}

type UpdateNicknameResponse = {
  success?: boolean;
  nicknameSlug?: string;
  error?: string;
};

function getNicknameErrorMessage(error?: string) {
  if (error === 'Duplicate nickname') return '\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uB2C9\uB124\uC784\uC774\uC5D0\uC694.';
  if (error === 'Nickname is not allowed') return '\uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uB2C9\uB124\uC784\uC774\uC5D0\uC694. \uB2E4\uB978 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.';
  return '\uB2C9\uB124\uC784\uC744 \uBCC0\uACBD\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
}

export default function NicknameEditor({
  initialNickname,
  isOwner = false,
  onNicknameChange,
}: NicknameEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [currentNickname, setCurrentNickname] = useState(initialNickname);
  const [nickname, setNickname] = useState(initialNickname);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (nickname === currentNickname) {
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
        const nextNickname = nickname.trim();
        setCurrentNickname(nextNickname);
        setNickname(nextNickname);
        onNicknameChange?.(nextNickname);
        setIsEditing(false);

        if (pathname.startsWith('/profile/') && data.nicknameSlug) {
          router.replace(`/profile/${encodeURIComponent(data.nicknameSlug)}`);
          router.refresh();
          return;
        }

        router.refresh();
        return;
      }

      alert(getNicknameErrorMessage(data?.error));
    } catch (error) {
      console.error(error);
      alert('\uC11C\uBC84\uC5D0 \uBB38\uC81C\uAC00 \uC788\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.');
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
            placeholder="\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694."
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
              setNickname(currentNickname);
              setIsEditing(false);
            }}
          />
        </div>
      ) : (
        <>
          <p className="truncate text-base font-bold text-white sm:text-lg md:text-2xl">{currentNickname}</p>
          {isOwner && (
            <IconButton icon={<Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={() => setIsEditing(true)} />
          )}
        </>
      )}
    </div>
  );
}