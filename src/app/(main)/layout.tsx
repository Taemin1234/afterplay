import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { nickname: true, role: true },
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
  const isAdmin = dbUser?.role === 'ADMIN';

  return (
    <>
      <Header user={user} nickname={nickname} isAdmin={isAdmin} />
      <main className='container mx-auto px-5 py-4 lg:py-8'>
        {children}
      </main>
      <Footer />
      <ScrollToTopButton />
      <MobileBottomNav user={user} nickname={nickname} isAdmin={isAdmin} />
    </>
  );
}
