import MusicListForm from '@/components/ui/organisms/MusicListForm';
import { fetchFeaturedSections } from '@/lib/music-lists';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export default async function CreateListPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dbUser = user
    ? await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
    : null;
  const featuredSections = dbUser?.role === 'ADMIN'
    ? (await fetchFeaturedSections()).filter((section) => section.key === 'weekly-new-releases')
    : [];

  return (
    <MusicListForm
      pageTitle="새 리스트 만들기"
      submitLabel="등록하기"
      featuredSections={featuredSections}
    />
  );
}
