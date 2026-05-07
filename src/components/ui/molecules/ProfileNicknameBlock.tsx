'use client';

import { useState } from 'react';
import NicknameEditor from '@/components/ui/molecules/NicknameEditor';

type ProfileNicknameBlockProps = {
  initialNickname: string;
  isOwner: boolean;
};

function AvatarCircle({
  nickname,
  sizeClassName,
}: {
  nickname: string;
  sizeClassName: string;
}) {
  const initial = nickname.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-700 font-semibold text-white ${sizeClassName}`}
      aria-label={`${nickname} default profile image`}
      role="img"
    >
      {initial}
    </div>
  );
}

export default function ProfileNicknameBlock({ initialNickname, isOwner }: ProfileNicknameBlockProps) {
  const [nickname, setNickname] = useState(initialNickname);

  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <AvatarCircle nickname={nickname} sizeClassName="h-12 w-12 text-base sm:h-14 sm:w-14 sm:text-lg" />
      <NicknameEditor initialNickname={nickname} isOwner={isOwner} onNicknameChange={setNickname} />
    </div>
  );
}
