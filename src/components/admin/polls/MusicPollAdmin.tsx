'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Edit3, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import Button from '@/components/ui/atoms/Button';

type PollItemType = 'TRACK' | 'ALBUM';
type PollStatus = 'OPEN' | 'CLOSED';

type MusicSearchItem = {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
  releaseDate?: string | null;
};

type PollOption = {
  id: string;
  order: number;
  spotifyId: string;
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string | null;
  result: {
    votesCount: number;
    percentage: number;
  } | null;
};

type AdminPoll = {
  id: string;
  title: string;
  description: string | null;
  itemType: PollItemType;
  status: PollStatus;
  isClosed: boolean;
  startsAt: string | null;
  endsAt: string | null;
  closedAt: string | null;
  createdAt: string;
  options: PollOption[];
  results: {
    totalVotes: number;
  } | null;
  commentsCount: number;
};

type EditablePollState = {
  title: string;
  description: string;
  endsAt: string;
  isUnlimited: boolean;
};

const emptyOptionSlots: [MusicSearchItem | null, MusicSearchItem | null] = [null, null];

function toDatetimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatDate(value: string | null) {
  if (!value) return '무기한';
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function itemTypeLabel(type: PollItemType) {
  return type === 'TRACK' ? '노래' : '앨범';
}

function statusLabel(poll: AdminPoll) {
  if (poll.isClosed) return '종료';
  return poll.endsAt ? '진행중' : '무기한 진행';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function MusicPollAdmin() {
  const [polls, setPolls] = useState<AdminPoll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [listSearchInput, setListSearchInput] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [listType, setListType] = useState<'ALL' | PollItemType>('ALL');

  const [itemType, setItemType] = useState<PollItemType>('TRACK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<[MusicSearchItem | null, MusicSearchItem | null]>(emptyOptionSlots);
  const [selectedSlot, setSelectedSlot] = useState<0 | 1>(0);
  const [musicSearchInput, setMusicSearchInput] = useState('');
  const [musicResults, setMusicResults] = useState<MusicSearchItem[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditablePollState | null>(null);
  const [pendingPollId, setPendingPollId] = useState<string | null>(null);

  const canCreate = useMemo(
    () => Boolean(title.trim() && selectedOptions[0] && selectedOptions[1] && selectedOptions[0]?.id !== selectedOptions[1]?.id),
    [title, selectedOptions]
  );

  const loadPolls = useCallback(async () => {
    setIsLoadingPolls(true);
    setError(null);

    try {
      const params = new URLSearchParams({ take: '50' });
      if (listSearch) params.set('q', listSearch);
      if (listType !== 'ALL') params.set('itemType', listType);

      const response = await fetch(`/api/admin/polls?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '투표 목록을 불러오지 못했습니다.');
      }

      const data = (await response.json()) as AdminPoll[];
      setPolls(data);
    } catch (e) {
      setError(getErrorMessage(e, '투표 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoadingPolls(false);
    }
  }, [listSearch, listType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setListSearch(listSearchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [listSearchInput]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    setSelectedOptions(emptyOptionSlots);
    setMusicResults([]);
    setMusicSearchInput('');
    setSelectedSlot(0);
  }, [itemType]);

  useEffect(() => {
    const query = musicSearchInput.trim();
    if (query.length < 2) {
      setMusicResults([]);
      setIsSearchingMusic(false);
      return;
    }

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setIsSearchingMusic(true);
      try {
        const response = await fetch(`/api/music/search?type=${itemType === 'TRACK' ? 'track' : 'album'}&q=${encodeURIComponent(query)}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('검색에 실패했습니다.');
        const data = (await response.json()) as MusicSearchItem[];
        if (!ignore) setMusicResults(data);
      } catch {
        if (!ignore) setMusicResults([]);
      } finally {
        if (!ignore) setIsSearchingMusic(false);
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [itemType, musicSearchInput]);

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setEndsAt('');
    setIsUnlimited(true);
    setSelectedOptions(emptyOptionSlots);
    setSelectedSlot(0);
    setMusicSearchInput('');
    setMusicResults([]);
  };

  const selectMusicItem = (item: MusicSearchItem) => {
    setSelectedOptions((prev) => {
      const next: [MusicSearchItem | null, MusicSearchItem | null] = [...prev] as [MusicSearchItem | null, MusicSearchItem | null];
      next[selectedSlot] = item;
      return next;
    });
    setSelectedSlot(selectedSlot === 0 ? 1 : 0);
    setMusicSearchInput('');
    setMusicResults([]);
  };

  const removeSelectedOption = (slot: 0 | 1) => {
    setSelectedOptions((prev) => {
      const next: [MusicSearchItem | null, MusicSearchItem | null] = [...prev] as [MusicSearchItem | null, MusicSearchItem | null];
      next[slot] = null;
      return next;
    });
    setSelectedSlot(slot);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const first = selectedOptions[0];
    const second = selectedOptions[1];
    if (!first || !second || first.id === second.id) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          itemType,
          endsAt: isUnlimited ? null : fromDatetimeLocal(endsAt),
          options: [
            { musicItem: first },
            { musicItem: second },
          ],
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '투표를 생성하지 못했습니다.');
      }

      resetCreateForm();
      setSuccess('투표가 생성되었습니다.');
      await loadPolls();
    } catch (e) {
      setError(getErrorMessage(e, '투표를 생성하지 못했습니다.'));
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (poll: AdminPoll) => {
    setEditingPollId(poll.id);
    setEditState({
      title: poll.title,
      description: poll.description ?? '',
      endsAt: toDatetimeLocal(poll.endsAt),
      isUnlimited: !poll.endsAt,
    });
  };

  const cancelEdit = () => {
    setEditingPollId(null);
    setEditState(null);
  };

  const saveEdit = async (pollId: string) => {
    if (!editState) return;
    setPendingPollId(pollId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editState.title,
          description: editState.description,
          endsAt: editState.isUnlimited ? null : fromDatetimeLocal(editState.endsAt),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '투표를 수정하지 못했습니다.');
      }

      setSuccess('투표가 수정되었습니다.');
      cancelEdit();
      await loadPolls();
    } catch (e) {
      setError(getErrorMessage(e, '투표를 수정하지 못했습니다.'));
    } finally {
      setPendingPollId(null);
    }
  };

  const patchPoll = async (pollId: string, body: Record<string, unknown>, successMessage: string) => {
    setPendingPollId(pollId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '투표 상태를 변경하지 못했습니다.');
      }
      setSuccess(successMessage);
      await loadPolls();
    } catch (e) {
      setError(getErrorMessage(e, '투표 상태를 변경하지 못했습니다.'));
    } finally {
      setPendingPollId(null);
    }
  };

  const deletePoll = async (poll: AdminPoll) => {
    if (!window.confirm(`"${poll.title}" 투표를 삭제하시겠습니까?`)) return;

    setPendingPollId(poll.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/polls/${poll.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '투표를 삭제하지 못했습니다.');
      }
      setSuccess('투표가 삭제되었습니다.');
      await loadPolls();
    } catch (e) {
      setError(getErrorMessage(e, '투표를 삭제하지 못했습니다.'));
    } finally {
      setPendingPollId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">투표 관리자</h1>
          <p className="mt-1 text-sm text-slate-400">노래 또는 앨범 두 후보로 대결 투표를 생성하고 관리합니다.</p>
        </div>
        <Button type="button" variant="outline" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={loadPolls}>
          새로고침
        </Button>
      </div>

      {error ? <p className="rounded-md border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      {success ? <p className="rounded-md border border-point/30 bg-point/10 px-3 py-2 text-sm text-point">{success}</p> : null}

      <form onSubmit={handleCreate} className="space-y-5 rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">새 투표 생성</h2>
          <div className="inline-flex rounded-md border border-white/10 bg-black/25 p-1">
            {(['TRACK', 'ALBUM'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setItemType(type)}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  itemType === type ? 'bg-point text-black' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {itemTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_220px]">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-400">제목</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-point"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-400">간단 설명</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-point"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-400">기간</span>
            <div className="flex h-[38px] items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white">
              <input
                id="poll-unlimited"
                type="checkbox"
                checked={isUnlimited}
                onChange={(e) => setIsUnlimited(e.target.checked)}
                className="h-4 w-4 accent-point"
              />
              <label htmlFor="poll-unlimited" className="text-slate-200">
                무기한
              </label>
            </div>
          </label>
        </div>

        {!isUnlimited ? (
          <label className="block max-w-xs space-y-1">
            <span className="text-xs font-medium text-slate-400">마감일</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-point"
            />
          </label>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedOptions.map((option, index) => {
              const slot = index as 0 | 1;
              const isActive = selectedSlot === slot;

              return (
                <div
                  key={slot}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSlot(slot)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    setSelectedSlot(slot);
                  }}
                  className={`min-h-[150px] rounded-lg border p-3 text-left transition-colors ${
                    isActive ? 'border-point bg-point/10' : 'border-white/10 bg-black/20 hover:bg-white/5'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                    <span>후보 {slot + 1}</span>
                    {isActive ? <span className="text-point">선택 중</span> : null}
                  </div>
                  {option ? (
                    <div className="flex gap-3">
                      <Image
                        src={option.albumImageUrl || '/dpc_icon.png'}
                        alt={option.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-white">{option.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{option.artist}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedOption(slot);
                          }}
                          className="mt-3 inline-flex items-center gap-1 rounded border border-red-400/40 px-2 py-1 text-xs text-red-300"
                        >
                          <X className="h-3 w-3" />
                          제거
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center text-sm text-slate-500">검색 결과에서 후보를 선택하세요.</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-400">{itemTypeLabel(itemType)} 검색</span>
              <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={musicSearchInput}
                  onChange={(e) => setMusicSearchInput(e.target.value)}
                  placeholder="후보 검색"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </label>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-white/10">
              {isSearchingMusic ? <p className="px-3 py-4 text-center text-sm text-slate-400">검색 중...</p> : null}
              {!isSearchingMusic && musicResults.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-slate-500">검색어를 입력하면 결과가 표시됩니다.</p>
              ) : null}
              {musicResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectMusicItem(item)}
                  className="flex w-full items-center gap-3 border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-white/5"
                >
                  <Image
                    src={item.albumImageUrl || '/dpc_icon.png'}
                    alt={item.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{item.name}</span>
                    <span className="block truncate text-xs text-slate-400">{item.artist}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" icon={<Plus className="h-4 w-4" />} disabled={!canCreate || isCreating}>
            {isCreating ? '생성 중...' : '투표 생성'}
          </Button>
        </div>
      </form>

      <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-white">투표 목록</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={listType}
              onChange={(e) => setListType(e.target.value as 'ALL' | PollItemType)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="ALL">전체</option>
              <option value="TRACK">노래</option>
              <option value="ALBUM">앨범</option>
            </select>
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={listSearchInput}
                onChange={(e) => setListSearchInput(e.target.value)}
                placeholder="곡/앨범/가수 검색"
                className="h-10 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {isLoadingPolls ? (
          <p className="py-8 text-center text-sm text-slate-400">투표 목록을 불러오는 중...</p>
        ) : polls.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">표시할 투표가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {polls.map((poll) => {
              const isEditing = editingPollId === poll.id;
              const isPending = pendingPollId === poll.id;

              return (
                <li key={poll.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                  <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded border border-white/10 px-2 py-1 text-slate-300">{itemTypeLabel(poll.itemType)}</span>
                        <span className={`rounded px-2 py-1 ${poll.isClosed ? 'bg-red-500/15 text-red-200' : 'bg-point/10 text-point'}`}>
                          {statusLabel(poll)}
                        </span>
                        <span className="text-slate-500">생성 {formatDate(poll.createdAt)}</span>
                        <span className="text-slate-500">마감 {formatDate(poll.endsAt)}</span>
                      </div>

                      {isEditing && editState ? (
                        <div className="space-y-2">
                          <input
                            value={editState.title}
                            onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                            className="w-full rounded-md border border-slate-700 bg-black px-3 py-2 text-sm text-white"
                          />
                          <input
                            value={editState.description}
                            onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                            className="w-full rounded-md border border-slate-700 bg-black px-3 py-2 text-sm text-white"
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                checked={editState.isUnlimited}
                                onChange={(e) => setEditState({ ...editState, isUnlimited: e.target.checked })}
                                className="h-4 w-4 accent-point"
                              />
                              무기한
                            </label>
                            {!editState.isUnlimited ? (
                              <input
                                type="datetime-local"
                                value={editState.endsAt}
                                onChange={(e) => setEditState({ ...editState, endsAt: e.target.value })}
                                className="rounded-md border border-slate-700 bg-black px-3 py-2 text-sm text-white"
                              />
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base font-semibold text-white">{poll.title}</h3>
                          {poll.description ? <p className="mt-1 text-sm text-slate-400">{poll.description}</p> : null}
                        </>
                      )}

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {poll.options.map((option) => (
                          <div key={option.id} className="flex min-w-0 items-center gap-3 rounded-md border border-white/10 bg-black/25 p-2">
                            <Image
                              src={option.imageUrl || '/dpc_icon.png'}
                              alt={option.title}
                              width={52}
                              height={52}
                              className="h-13 w-13 rounded object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{option.title}</p>
                              <p className="truncate text-xs text-slate-400">{option.artist}</p>
                              <p className="mt-1 text-xs text-slate-500">{option.result?.percentage ?? 0}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-3">
                      <div className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                        <div className="flex justify-between">
                          <span>총 투표수</span>
                          <span className="font-semibold text-white">{poll.results?.totalVotes ?? 0}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <span>댓글</span>
                          <span className="font-semibold text-white">{poll.commentsCount}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              icon={<Check className="h-4 w-4" />}
                              onClick={() => saveEdit(poll.id)}
                              disabled={isPending}
                            >
                              저장
                            </Button>
                            <Button type="button" variant="outline" size="sm" color="white" onClick={cancelEdit} disabled={isPending}>
                              취소
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              color="white"
                              size="sm"
                              icon={<Edit3 className="h-4 w-4" />}
                              onClick={() => startEdit(poll)}
                              disabled={isPending}
                            >
                              수정
                            </Button>
                            {!poll.isClosed ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  color="white"
                                  size="sm"
                                  icon={<CalendarClock className="h-4 w-4" />}
                                  onClick={() => patchPoll(poll.id, { closeInDays: 3 }, '마감일이 3일 후로 설정되었습니다.')}
                                  disabled={isPending}
                                >
                                  3일 후 종료
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  color="white"
                                  size="sm"
                                  onClick={() => patchPoll(poll.id, { status: 'CLOSED' }, '투표가 종료되었습니다.')}
                                  disabled={isPending}
                                >
                                  종료
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                color="white"
                                size="sm"
                                onClick={() => patchPoll(poll.id, { status: 'OPEN', endsAt: null }, '투표가 다시 열렸습니다.')}
                                disabled={isPending}
                              >
                                다시 열기
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              icon={<Trash2 className="h-4 w-4" />}
                              onClick={() => deletePoll(poll)}
                              disabled={isPending}
                            >
                              삭제
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
