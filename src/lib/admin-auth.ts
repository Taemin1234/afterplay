import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function getAdminUserOrNull() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      nickname: true,
    },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') return null;

  return dbUser;
}
