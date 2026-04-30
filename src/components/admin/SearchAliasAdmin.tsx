'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../ui/atoms/Button';

type MusicAliasType = 'TRACK_ARTIST' | 'TRACK_TITLE' | 'ALBUM_ARTIST' | 'ALBUM_TITLE';

type AliasItem = {
  id: number;
  type: MusicAliasType;
  canonical: string;
  alias: string;
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

const typeOptions: Array<{ value: MusicAliasType; label: string }> = [
  { value: 'TRACK_ARTIST', label: '아티스트' },
  { value: 'TRACK_TITLE', label: '곡 제목' },
  { value: 'ALBUM_TITLE', label: '앨범 제목' },
];

function getTypeLabel(type: MusicAliasType) {
  if (type === 'TRACK_ARTIST' || type === 'ALBUM_ARTIST') return '아티스트';
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

  const [type, setType] = useState<MusicAliasType>('TRACK_ARTIST');
  const [canonical, setCanonical] = useState('');
  const [alias, setAlias] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCanonical, setEditCanonical] = useState('');
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/search-aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, canonical, alias }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '별칭을 추가하지 못했습니다.');
      }

      setCanonical('');
      setAlias('');
      setPage(1);
      await loadItems(1);
    } catch (e) {
      const message = e instanceof Error ? e.message : '별칭을 추가하지 못했습니다.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

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
    setEditCanonical(item.canonical);
    setEditAlias(item.alias);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCanonical('');
    setEditAlias('');
  };

  const saveEdit = async (id: number) => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/search-aliases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonical: editCanonical, alias: editAlias }),
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
    <section className='mx-auto w-full max-w-4xl space-y-6'>
      <h1 className='text-xl font-semibold text-white'>검색 별칭 관리자</h1>

      <form onSubmit={handleCreate} className='grid gap-3 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-4'>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MusicAliasType)}
          className='rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white'
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          value={canonical}
          onChange={(e) => setCanonical(e.target.value)}
          placeholder='원본명 (예: Buzz)'
          className='rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white'
        />

        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder='별칭 (예: 버즈)'
          className='rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white'
        />

        <Button type='submit' variant='outline' size='sm' disabled={isSaving} className='bg-[#39ff14]/10 justify-center  disabled:opacity-50'>
          {isSaving ? '저장 중...' : '별칭 추가'}
        </Button>
      </form>

      {error ? <p className='text-sm text-red-300'>{error}</p> : null}

      <div className='flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder='원본명 또는 별칭 검색'
            className='min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#39ff14]'
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
        <p className='text-sm text-slate-400'>별칭 목록을 불러오는 중...</p>
      ) : (
        <>
          <div className='overflow-x-auto rounded-lg border border-white/10'>
            <table className='min-w-full divide-y divide-white/10 text-sm'>
              <thead className='bg-black/30 text-slate-300'>
                <tr>
                  <th className='px-3 py-2 text-left font-medium'>유형</th>
                  <th className='px-3 py-2 text-left font-medium'>원본명</th>
                  <th className='px-3 py-2 text-left font-medium'>별칭</th>
                  <th className='px-3 py-2 text-left font-medium'>수정일</th>
                  <th className='px-3 py-2 text-right font-medium'>작업</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/10'>
                {items.length === 0 ? (
                  <tr className='bg-black/10'>
                    <td colSpan={5} className='px-3 py-8 text-center text-slate-400'>
                      표시할 별칭이 없습니다.
                    </td>
                  </tr>
                ) : null}
                {items.map((item) => {
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className='bg-black/10'>
                      <td className='px-3 py-2 text-slate-200'>{getTypeLabel(item.type)}</td>
                      <td className='px-3 py-2'>
                        {isEditing ? (
                          <input
                            value={editCanonical}
                            onChange={(e) => setEditCanonical(e.target.value)}
                            className='w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white'
                          />
                        ) : (
                          <span className='text-slate-100'>{item.canonical}</span>
                        )}
                      </td>
                      <td className='px-3 py-2'>
                        {isEditing ? (
                          <input
                            value={editAlias}
                            onChange={(e) => setEditAlias(e.target.value)}
                            className='w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white'
                          />
                        ) : (
                          <span className='text-slate-100'>{item.alias}</span>
                        )}
                      </td>
                      <td className='px-3 py-2 text-slate-400'>{new Date(item.updatedAt).toLocaleString('ko-KR')}</td>
                      <td className='px-3 py-2 text-right'>
                        {isEditing ? (
                          <div className='inline-flex gap-2'>
                            <button
                              type='button'
                              onClick={() => saveEdit(item.id)}
                              className='rounded-md border border-[#39ff14]/40 bg-[#39ff14]/10 px-2 py-1 text-xs text-[#39ff14]'
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
                      ? 'border-[#39ff14]/60 bg-[#39ff14]/10 text-[#39ff14]'
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
