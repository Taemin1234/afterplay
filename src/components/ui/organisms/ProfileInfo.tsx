'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import Button from '@/components/ui/atoms/Button';
import NicknameEditor from '@/components/ui/molecules/NicknameEditor';
import ProfileFollowSection from '@/components/ui/organisms/ProfileFollowSection';

interface ProfileInfoProps {
  profileUserId: string;
  initialNickname: string;
  isOwner?: boolean;
  viewerUserId?: string | null;
  initialFollowerCount?: number;
  initialFollowingCount?: number;
  initialIsFollowing?: boolean;
}

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

export default function ProfileInfo({
  profileUserId,
  initialNickname,
  isOwner = false,
  viewerUserId = null,
  initialFollowerCount = 0,
  initialFollowingCount = 0,
  initialIsFollowing = false,
}: ProfileInfoProps) {
  const [nickname, setNickname] = useState(initialNickname);

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#39ff14]/20 bg-black/40 px-4 py-5 shadow-xl sm:flex-row sm:items-center sm:gap-6 md:px-8 md:py-10">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <AvatarCircle nickname={nickname} sizeClassName="h-12 w-12 text-base sm:h-14 sm:w-14 sm:text-lg" />
          <NicknameEditor initialNickname={nickname} isOwner={isOwner} onNicknameChange={setNickname} />
        </div>

        <ProfileFollowSection
          profileUserId={profileUserId}
          isOwner={isOwner}
          viewerUserId={viewerUserId}
          initialFollowerCount={initialFollowerCount}
          initialFollowingCount={initialFollowingCount}
          initialIsFollowing={initialIsFollowing}
        />
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {isOwner && (
          <Link href="/createList" scroll={false} className="w-full sm:w-auto">
            <Button rounded="full" as="span" icon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">
              플레이리스트 만들기
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}