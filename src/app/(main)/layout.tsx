import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
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

  const nickname = dbUser?.nickname ?? null;

  return (
    <>
      <Header user={user} nickname={nickname} />
      <main className='container mx-auto px-5 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-4 lg:py-8'>
        {children}
        {modal}
      </main>
      <MobileBottomNav user={user} nickname={nickname} />
      {/* <Footer /> */}
    </>
  );
}
