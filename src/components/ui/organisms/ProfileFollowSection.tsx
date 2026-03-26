'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Button from '@/components/ui/atoms/Button';
import ModalWrap from '@/components/ui/molecules/ModalWrap';

type FollowListType = 'followers' | 'following';

// 받아올 유저의 데이터 형태
type FollowListItem = {
  id: string;
  nickname: string;
  nicknameSlug: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
  isMe: boolean;
};

// 전체 호출 결과 형태
type FollowListResponse = {
  type: FollowListType;
  items: FollowListItem[];
};

// 부모로부터 프로필관련 초기값
interface ProfileFollowSectionProps {
  profileUserId: string;
  isOwner?: boolean;
  viewerUserId?: string | null;
  initialFollowerCount?: number;
  initialFollowingCount?: number;
  initialIsFollowing?: boolean;
}

// 프로필 사진 컴포넌트
function ListAvatar({
  nickname,
  avatarUrl,
}: {
  nickname: string;
  avatarUrl: string | null;
}) {
  // avatarUrl이 없으면 닉네임의 첫글자를 보여줌
  const initial = nickname.trim().charAt(0).toUpperCase() || '?';

  if (avatarUrl) {
    return (
      <div
        className="h-10 w-10 shrink-0 rounded-full bg-slate-700 bg-cover bg-center"
        style={{ backgroundImage: `url(${avatarUrl})` }}
        aria-label={`${nickname} 프로필 이미지`}
        role="img"
      />
    );
  }

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 font-semibold text-white"
      aria-label={`${nickname} 기본 프로필 이미지`}
      role="img"
    >
      {initial}
    </div>
  );
}

// 메인 컴포넌트
export default function ProfileFollowSection({
  profileUserId,
  isOwner = false,
  viewerUserId = null,
  initialFollowerCount = 0,
  initialFollowingCount = 0,
  initialIsFollowing = false,
}: ProfileFollowSectionProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [followerCount, setFollowerCount] = useState(initialFollowerCount); // 현재 프로필의 팔로워 수
  const followingCount = initialFollowingCount; // 현재 프로필 팔로잉 수
  const [isFollowingProfile, setIsFollowingProfile] = useState(initialIsFollowing); // 현재 로그인한 사용자가 프로필 주인을 팔로우중인지 여부
  const [openListType, setOpenListType] = useState<FollowListType | null>(null); // 모달이 어떤 타입인지 확인
  const [isListLoading, setIsListLoading] = useState(false); // api 불러오는 중인지 여부
  const [followList, setFollowList] = useState<FollowListItem[]>([]); // 사용자 목록 데이터
  const [togglingUserIds, setTogglingUserIds] = useState<Record<string, boolean>>({}); //팔로우/언팔로우 처리중인 유저 기록

  // 내프로필이 아니고 로그인한 사용자가 있으면 팔로우 가능
  const canFollowProfile = !isOwner && Boolean(viewerUserId);

  // 상단 제목 결정
  const listTitle = useMemo(() => {
    if (openListType === 'followers') return '팔로워';
    if (openListType === 'following') return '팔로잉';
    return '';
  }, [openListType]);

  // 모달 닫기
  const closeList = useCallback(() => setOpenListType(null), []);

  // 팔로잉/팔로우 목록 조회
  const loadFollowList = useCallback(
    async (type: FollowListType) => {
      setOpenListType(type); // 모달 열기
      setIsListLoading(true); // 로딩 시작

      // api 요청
      try {
        const res = await fetch(`/api/follows/${profileUserId}?type=${type}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch follow list');
        const data = (await res.json()) as FollowListResponse;
        setFollowList(data.items);
      } catch (error) {
        console.error(error);
        setFollowList([]);
      } finally {
        setIsListLoading(false);
      }
    },
    [profileUserId]
  );

  // 모달 내 특정 유저의 팔로잉 상태만 변경
  const updateListItemFollowState = useCallback((targetUserId: string, nextValue: boolean) => {
    setFollowList((prev) =>
      prev.map((item) => (item.id === targetUserId ? { ...item, isFollowing: nextValue } : item))
    );
  }, []);

  // 팔로우 토글
  const toggleFollow = useCallback(
    async (targetUserId: string, currentlyFollowing: boolean) => {
      if (!viewerUserId) {
        const next = pathname ? encodeURIComponent(pathname) : '/';
        router.push(`/auth/login?next=${next}`);
        return;
      }

      setTogglingUserIds((prev) => ({ ...prev, [targetUserId]: true }));

      try {
        const res = await fetch(`/api/follows/${targetUserId}`, {
          method: currentlyFollowing ? 'DELETE' : 'POST', // 팔로우 중이면 delete, 아니면 post
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? 'Follow action failed');
        }

        // 성공 시 isFollowing과 followrCount 프론트로 전달
        const payload = (await res.json()) as { isFollowing: boolean; followerCount?: number };
        updateListItemFollowState(targetUserId, payload.isFollowing);

        // 프로필 주인 자체를 토글한 경우
        if (targetUserId === profileUserId) {
          setIsFollowingProfile(payload.isFollowing);
          if (typeof payload.followerCount === 'number') {
            setFollowerCount(payload.followerCount);
          } else {
            setFollowerCount((prev) => (payload.isFollowing ? prev + 1 : Math.max(prev - 1, 0)));
          }
        }
      } catch (error) {
        console.error(error);
        alert('팔로우 상태 변경 중 문제가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setTogglingUserIds((prev) => {
          const next = { ...prev };
          delete next[targetUserId];
          return next;
        });
      }
    },
    [pathname, profileUserId, router, updateListItemFollowState, viewerUserId]
  );

  // 프로필 팔로우 버튼
  const handleProfileFollowToggle = useCallback(() => {
    void toggleFollow(profileUserId, isFollowingProfile);
  }, [isFollowingProfile, profileUserId, toggleFollow]);

  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-col gap-4 sm:items-center sm:gap-5 sm:flex-row">
        <div className="flex items-center gap-4 text-sm text-white sm:text-base">
          <button
            type="button"
            onClick={() => void loadFollowList('following')}
            className="cursor-pointer text-center transition-opacity hover:opacity-80"
          >
            <p>{followingCount}</p>
            <p>팔로잉</p>
          </button>

          <button
            type="button"
            onClick={() => void loadFollowList('followers')}
            className="cursor-pointer text-center transition-opacity hover:opacity-80"
          >
            <p>{followerCount}</p>
            <p>팔로워</p>
          </button>
        </div>

        {!isOwner && (
          <Button
            rounded="full"
            size='sm'
            variant={isFollowingProfile ? 'outline' : 'primary'}
            disabled={Boolean(togglingUserIds[profileUserId])}
            onClick={handleProfileFollowToggle}
            className="w-full text-sm! sm:w-auto"
          >
            {isFollowingProfile ? '팔로우 취소' : '팔로우'}
          </Button>
        )}
      </div>

      {openListType && (
        <ModalWrap
          onClose={closeList}
          panelClassName="!max-w-2xl !p-0 !max-h-[100dvh] !h-[100dvh] !rounded-none md:!h-auto md:!max-h-[85vh] md:!rounded-2xl"
        >
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#060b16]/95 px-4 py-3">
              <h3 className="text-lg font-bold text-white">{listTitle}</h3>
              <Button size="sm" rounded="full" variant="outline" onClick={closeList}>
                닫기
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {isListLoading ? (
                <p className="text-sm text-slate-400">불러오는 중...</p>
              ) : followList.length === 0 ? (
                <p className="text-sm text-slate-400">표시할 사용자가 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {followList.map((item) => {
                    const profileHref = item.nicknameSlug
                      ? `/profile/${encodeURIComponent(item.nicknameSlug)}`
                      : undefined;

                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <ListAvatar nickname={item.nickname} avatarUrl={item.avatarUrl} />
                          <div className="min-w-0 flex-1">
                            {profileHref ? (
                              <Link href={profileHref} className="block min-w-0">
                                <p className="truncate text-sm font-medium text-white">{item.nickname}</p>
                                <p className="text-xs text-slate-400">프로필 보기</p>
                              </Link>
                            ) : (
                              <div className="block min-w-0">
                                <p className="truncate text-sm font-medium text-white">{item.nickname}</p>
                                <p className="text-xs text-slate-400">프로필 주소 없음</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {item.isMe ? (
                          <Button size="sm" rounded="full" variant="outline" disabled>
                            나
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            rounded="full"
                            variant={item.isFollowing ? 'outline' : 'primary'}
                            onClick={(e) => {
                              e.preventDefault();
                              void toggleFollow(item.id, item.isFollowing);
                            }}
                            disabled={Boolean(togglingUserIds[item.id]) || !viewerUserId}
                          >
                            {item.isFollowing ? '팔로우 취소' : '팔로우'}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </ModalWrap>
      )}

      {!canFollowProfile && !isOwner && !viewerUserId ? (
        <p className="mt-1 text-xs text-slate-400">팔로우하려면 로그인하세요.</p>
      ) : null}
    </div>
  );
}
