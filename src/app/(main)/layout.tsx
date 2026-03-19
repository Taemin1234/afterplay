import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export default async function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { nickname: true },
      })
    : null;

  const metadataName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.preferred_username ??
    null;
  const emailName = user?.email?.split('@')[0] ?? null;
  const fallbackNickname = metadataName || emailName;
  const nickname = dbUser?.nickname ?? fallbackNickname ?? null;

  return (
    <>
      <Header user={user} nickname={nickname} />
      <main className='container mx-auto px-5 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-4 lg:py-8'>
        {children}
        {modal}
      </main>
      <ScrollToTopButton />
      <MobileBottomNav user={user} nickname={nickname} />
      {/* <Footer /> */}
    </>
  );
}
