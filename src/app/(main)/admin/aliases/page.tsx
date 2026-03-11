import SearchAliasAdmin from '@/components/admin/SearchAliasAdmin';
import { getAdminUserOrNull } from '@/lib/admin-auth';

export default async function AdminAliasesPage() {
  const admin = await getAdminUserOrNull();

  if (!admin) {
    return (
      <section className='mx-auto w-full max-w-2xl rounded-lg border border-red-500/30 bg-red-950/20 p-6'>
        <h1 className='text-lg font-semibold text-red-200'>Forbidden</h1>
        <p className='mt-2 text-sm text-red-300'>관리자만 접근할 수 있습니다.</p>
      </section>
    );
  }

  return <SearchAliasAdmin />;
}
