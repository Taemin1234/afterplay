import Link from 'next/link';
import { redirect } from 'next/navigation';
import UserSummaryCards from '@/components/ui/organisms/UserSummaryCards';
import UserDashboardInsights from '@/components/ui/organisms/UserDashboardInsights';
import prisma from '@/lib/prisma';
import { getUserDashboardStats } from '@/lib/dashboard-stats';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/dashboard');
  }

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nickname: true },
  });

  const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
  const initialNickname = me?.nickname || googleName || '익명';
  const dashboardStats = await getUserDashboardStats(user.id);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white sm:text-2xl">{initialNickname} 대시보드</h1>
        <Link
          href="/mypage"
          className="rounded-md border border-white/20 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10"
        >
          마이페이지
        </Link>
      </div>
      <UserSummaryCards stats={dashboardStats.summary} className="mt-0" />
      <UserDashboardInsights stats={dashboardStats} />
    </section>
  );
}
