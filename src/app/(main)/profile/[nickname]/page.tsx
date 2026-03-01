import ProfileInfo from '@/components/ui/organisms/ProfileInfo';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export default async function UserProfile({ params }: { params: Promise<{ nickname: string }> }) {
    const { nickname } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const dbUser = await prisma.user.findUnique({
        where: { id: user?.id }
    });

    const isOwner = dbUser?.nickname === nickname;

    return (
        <div>
            <ProfileInfo initialNickname={nickname} isOwner={isOwner} />
        </div>
    )
}