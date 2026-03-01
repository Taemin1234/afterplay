import ProfileInfo from '@/components/ui/organisms/ProfileInfo';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function UserProfile({
  params,
}: {
  params: Promise<{ nicknameSlug: string }>;
}) {
  const { nicknameSlug: rawNicknameSlug } = await params;

  let decodedNicknameSlug = rawNicknameSlug;
  try {
    decodedNicknameSlug = decodeURIComponent(rawNicknameSlug);
  } catch {
    decodedNicknameSlug = rawNicknameSlug;
  }

  const profileUser = await prisma.user.findFirst({
    where: {
      OR: [{ nicknameSlug: rawNicknameSlug }, { nicknameSlug: decodedNicknameSlug }],
    },
    select: { id: true, nickname: true },
  });

  if (!profileUser) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = Boolean(user?.id && user.id === profileUser.id);

  return (
    <div>
      <ProfileInfo initialNickname={profileUser.nickname ?? '익명'} isOwner={isOwner} />
    </div>
  );
}
