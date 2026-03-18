import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { DELETED_USER_EMAIL, DELETED_USER_ID, DELETED_USER_NICKNAME } from '@/lib/deleted-user';
import { createSupabaseAdminClient } from '@/utils/supabase/admin'; // 관리자 권한을 사용
import { createSupabaseServerClient } from '@/utils/supabase/server'; // 로그인한 사용자 확인

// 함수 에러를 보기 좋은 형태로 변환
function toErrorDetail(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return { message: String(error), code: null };
  }

  const maybe = error as { message?: string; code?: string };
  return {
    message: maybe.message ?? 'Unknown error',
    code: maybe.code ?? null,
  };
}

export async function DELETE() {
  // 현재 로그인한 사용자 가져오기
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 더미 계정은 삭제 불가
  if (user.id === DELETED_USER_ID) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
  }

  try {
    // transaction : 내부 작업ㅇ르 한덩어리로 처리
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // upsert : 있으면 update, 없으면 create
      // 탈퇴한 사용자 전용계정
      await tx.user.upsert({
        where: { id: DELETED_USER_ID },
        update: {
          email: DELETED_USER_EMAIL,
          nickname: DELETED_USER_NICKNAME,
          nicknameSlug: null,
          avatarUrl: null,
          isDeletedPlaceholder: true,
          deletedAt: now,
        },
        create: {
          id: DELETED_USER_ID,
          email: DELETED_USER_EMAIL,
          nickname: DELETED_USER_NICKNAME,
          nicknameSlug: null,
          avatarUrl: null,
          isDeletedPlaceholder: true,
          deletedAt: now,
        },
      });

      // 모든 데이터 작성자 변경
      await tx.playlist.updateMany({
        where: { authorId: user.id },
        data: { authorId: DELETED_USER_ID },
      });

      await tx.albumList.updateMany({
        where: { authorId: user.id },
        data: { authorId: DELETED_USER_ID },
      });

      await tx.playlistComment.updateMany({
        where: { userId: user.id },
        data: { userId: DELETED_USER_ID },
      });

      await tx.albumListComment.updateMany({
        where: { userId: user.id },
        data: { userId: DELETED_USER_ID },
      });

      await tx.listFeed.updateMany({
        where: { userId: user.id },
        data: { userId: DELETED_USER_ID },
      });

      // 기존 user 행 삭제
      await tx.user.deleteMany({
        where: { id: user.id },
      });
    });

    // db 삭제 완료 후 supabase auth 삭제
    const adminClient = createSupabaseAdminClient();
    let authDeleted = false;

    if (adminClient) {
      const { error } = await adminClient.auth.admin.deleteUser(user.id);
      if (error) {
        console.error('[account-delete] auth delete failed', error);
      } else {
        authDeleted = true;
      }
    } else {
      console.warn('[account-delete] SUPABASE_SERVICE_ROLE_KEY missing, auth user was not deleted');
    }

    return NextResponse.json({ success: true, authDeleted });
  } catch (error) {
    const detail = toErrorDetail(error);
    console.error('[account-delete] failed', detail, error);

    return NextResponse.json(
      {
        error: 'Delete failed',
        detail: process.env.NODE_ENV === 'development' ? detail : undefined,
      },
      { status: 500 }
    );
  }
}
