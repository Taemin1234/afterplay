
import Link from 'next/link';
import { Plus } from 'lucide-react';

import Button from '@/components/ui/atoms/Button';
import ProfileNicknameBlock from '@/components/ui/molecules/ProfileNicknameBlock';
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

export default function ProfileInfo({
  profileUserId,
  initialNickname,
  isOwner = false,
  viewerUserId = null,
  initialFollowerCount = 0,
  initialFollowingCount = 0,
  initialIsFollowing = false,
}: ProfileInfoProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-point/20 bg-black/40 px-4 py-5 shadow-xl sm:flex-row sm:items-center sm:gap-6 md:px-8 md:py-10">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <ProfileNicknameBlock initialNickname={initialNickname} isOwner={isOwner} />

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
