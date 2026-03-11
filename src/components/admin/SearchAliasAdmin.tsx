'use client';

import { useEffect, useState } from 'react';

type MusicAliasType = 'TRACK_ARTIST' | 'TRACK_TITLE' | 'ALBUM_ARTIST' | 'ALBUM_TITLE';

type AliasItem = {
  id: number;
  type: MusicAliasType;
  canonical: string;
  alias: string;
  createdAt: string;
  updatedAt: string;
};

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

  const [type, setType] = useState<MusicAliasType>('TRACK_ARTIST');
  const [canonical, setCanonical] = useState('');
  const [alias, setAlias] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCanonical, setEditCanonical] = useState('');
  const [editAlias, setEditAlias] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/search-aliases', { cache: 'no-store' });
      if (!response.ok) throw new Error('별칭 목록을 불러오지 못했습니다.');
      const data: { items: AliasItem[] } = await response.json();
      setItems(data.items);
    } catch (e) {
      const message = e instanceof Error ? e.message : '별칭 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

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
      await loadItems();
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

      setItems((prev) => prev.filter((item) => item.id !== id));
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

      await loadItems();
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

        <button
          type='submit'
          disabled={isSaving}
          className='rounded-md border border-[#39ff14]/40 bg-[#39ff14]/10 px-3 py-2 text-sm text-[#39ff14] disabled:opacity-50'
        >
          {isSaving ? '저장 중...' : '별칭 추가'}
        </button>
      </form>

      {error ? <p className='text-sm text-red-300'>{error}</p> : null}

      {isLoading ? (
        <p className='text-sm text-slate-400'>별칭 목록을 불러오는 중...</p>
      ) : (
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
      )}
    </section>
  );
}
