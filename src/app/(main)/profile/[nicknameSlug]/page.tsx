import ProfileInfo from '@/components/ui/organisms/ProfileInfo';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import { fetchListItems } from '@/lib/music-lists';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function UserProfile({ params }: { params: Promise<{ nicknameSlug: string }>; }) {
  //  URL에 받은 slug rawNicknameSlug에 저장
  const { nicknameSlug: rawNicknameSlug } = await params;

  // 퍼센트 인코딩을 한글로 디코딩
  let decodedNicknameSlug = rawNicknameSlug;
  try {
    decodedNicknameSlug = decodeURIComponent(rawNicknameSlug);
  } catch {
    decodedNicknameSlug = rawNicknameSlug;
  }

  // DB에서 유저 찾기(rawNicknameSlug 또는 decodedNicknameSlug 중 하나라도 일치하는 유저를 찾음)
  const profileUser = await prisma.user.findFirst({
    where: {
      OR: [{ nicknameSlug: rawNicknameSlug }, { nicknameSlug: decodedNicknameSlug }],
    },
    select: { id: true, nickname: true },
  });

  if (!profileUser) {
    notFound();
  }

  // Supabase에서 현재 로그인된 유저 가져오기
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = Boolean(user?.id && user.id === profileUser.id);
  
  // 유저의 모든 플리 가져오기
  const { items } = await fetchListItems({
    type: 'all',
    limit: 16,
    cursor: null,
    feedUserId: profileUser.id,
    authorId: profileUser.id,
    visibility: isOwner ? 'all' : 'public',
  });

  return (
    <div>
      <ProfileInfo initialNickname={profileUser.nickname ?? '익명'} isOwner={isOwner} />
      <section className="mt-8">
        <MusicListGrid items={items} />
      </section>
    </div>
  );
}
