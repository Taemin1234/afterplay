'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type MusicAliasType = 'TRACK_ARTIST' | 'TRACK_TITLE' | 'ALBUM_ARTIST' | 'ALBUM_TITLE' | 'ARTIST_NAME';

type AliasItem = {
  id: number;
  type: MusicAliasType;
  canonical: string;
  alias: string | null;
  spotifyId: string | null;
  context: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type AliasListResponse = {
  items: AliasItem[];
  total: number;
  page: number;
  pageSize: number;
};

const pageSize = 20;

function getTypeLabel(type: MusicAliasType) {
  if (type === 'TRACK_ARTIST' || type === 'ALBUM_ARTIST' || type === 'ARTIST_NAME') return '가수명';
  if (type === 'TRACK_TITLE') return '곡 제목';
  return '앨범 제목';
}

export default function SearchAliasAdmin() {
  const [items, setItems] = useState<AliasItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAlias, setEditAlias] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const pageNumbers = useMemo(() => {
    const end = Math.min(totalPages, Math.max(5, page + 2));
    const start = Math.max(1, end - 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);
  const visibleStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const visibleEnd = Math.min(page * pageSize, total);

  const loadItems = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);

      const response = await fetch(`/api/admin/search-aliases?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('별칭 목록을 불러오지 못했습니다.');
      const data: AliasListResponse = await response.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      const message = e instanceof Error ? e.message : '별칭 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadItems(page);
  }, [loadItems, page]);

  const handleDelete = async (id: number) => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/search-aliases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '별칭을 삭제하지 못했습니다.');
      }

      if (items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
        return;
      }

      await loadItems(page);
    } catch (e) {
      const message = e instanceof Error ? e.message : '별칭을 삭제하지 못했습니다.';
      setError(message);
    }
  };

  const startEdit = (item: AliasItem) => {
    setEditingId(item.id);
    setEditAlias(item.alias ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAlias('');
  };

  const saveEdit = async (item: AliasItem) => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/search-aliases/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonical: item.canonical, alias: editAlias }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '별칭을 수정하지 못했습니다.');
      }

      await loadItems(page);
      cancelEdit();
    } catch (e) {
      const message = e instanceof Error ? e.message : '별칭을 수정하지 못했습니다.';
      setError(message);
    }
  };

  return (
    <section className='mx-auto w-full max-w-6xl space-y-6'>
      <div>
        <h1 className='text-xl font-semibold text-white'>음악 한글명 관리자</h1>
        <p className='mt-1 text-sm text-slate-400'>등록된 Spotify 곡·앨범·가수의 한글 표시명을 관리합니다.</p>
      </div>

      {error ? <p className='text-sm text-red-300'>{error}</p> : null}

      <div className='flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder='Spotify ID, 원본명 또는 한글명 검색'
            className='min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-point'
          />
          {searchInput ? (
            <button
              type='button'
              onClick={() => setSearchInput('')}
              className='rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-white/5'
            >
              초기화
            </button>
          ) : null}
        </div>
        <p className='text-sm text-slate-400'>
          {isLoading ? '불러오는 중' : `${visibleStart}-${visibleEnd} / ${total}개`}
        </p>
      </div>

      {isLoading ? (
        <p className='text-sm text-slate-400'>음악 이름 목록을 불러오는 중...</p>
      ) : (
        <>
          <div className='overflow-x-auto rounded-lg border border-white/10'>
            <table className='min-w-full divide-y divide-white/10 text-sm'>
              <thead className='bg-black/30 text-slate-300'>
                <tr>
                  <th className='px-3 py-2 text-left font-medium'>유형</th>
                  <th className='px-3 py-2 text-left font-medium'>Spotify ID</th>
                  <th className='px-3 py-2 text-left font-medium'>원본명</th>
                  <th className='px-3 py-2 text-left font-medium'>관련 정보</th>
                  <th className='px-3 py-2 text-left font-medium'>한글명</th>
                  <th className='px-3 py-2 text-left font-medium'>수정일</th>
                  <th className='px-3 py-2 text-right font-medium'>작업</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/10'>
                {items.length === 0 ? (
                  <tr className='bg-black/10'>
                    <td colSpan={7} className='px-3 py-8 text-center text-slate-400'>
                      표시할 음악 이름이 없습니다.
                    </td>
                  </tr>
                ) : null}
                {items.map((item) => {
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className='bg-black/10'>
                      <td className='px-3 py-2 text-slate-200'>{getTypeLabel(item.type)}</td>
                      <td className='max-w-36 truncate px-3 py-2 font-mono text-xs text-slate-400' title={item.spotifyId ?? undefined}>
                        {item.spotifyId ?? '수동 등록'}
                      </td>
                      <td className='px-3 py-2'>
                        <span className='text-slate-100'>{item.canonical}</span>
                      </td>
                      <td className='px-3 py-2 text-slate-400'>{item.context ?? '-'}</td>
                      <td className='px-3 py-2'>
                        {isEditing ? (
                          <input
                            value={editAlias}
                            onChange={(e) => setEditAlias(e.target.value)}
                            className='w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white'
                          />
                        ) : (
                          <span className={item.alias ? 'text-slate-100' : 'text-amber-300'}>{item.alias ?? '미등록'}</span>
                        )}
                      </td>
                      <td className='px-3 py-2 text-slate-400'>{new Date(item.updatedAt).toLocaleString('ko-KR')}</td>
                      <td className='px-3 py-2 text-right'>
                        {isEditing ? (
                          <div className='inline-flex gap-2'>
                            <button
                              type='button'
                              onClick={() => saveEdit(item)}
                              className='rounded-md border border-point/40 bg-point/10 px-2 py-1 text-xs text-point'
                            >
                              저장
                            </button>
                            <button
                              type='button'
                              onClick={cancelEdit}
                              className='rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300'
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className='inline-flex gap-2'>
                            <button
                              type='button'
                              onClick={() => startEdit(item)}
                              className='rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300'
                            >
                              수정
                            </button>
                            <button
                              type='button'
                              onClick={() => handleDelete(item.id)}
                              className='rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300'
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-slate-400'>
              {totalPages}페이지 중 {page}페이지
            </p>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className='rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40'
              >
                이전
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type='button'
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  className={`h-9 min-w-9 rounded-md border px-3 text-sm ${
                    pageNumber === page
                      ? 'border-point/60 bg-point/10 text-point'
                      : 'border-slate-700 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type='button'
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className='rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40'
              >
                다음
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
