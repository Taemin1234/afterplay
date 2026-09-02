import type { StoredMusicListContentBlock } from '@/types/music-list-content';

const MAX_CONSECUTIVE_LINE_BREAKS = 5;

export function normalizeTextBlockContent(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\n{6,}/g, '\n'.repeat(MAX_CONSECUTIVE_LINE_BREAKS))
    .replace(/^[^\S\n]+/, '')
    .replace(/[^\S\n]+$/, '');
}

export function parseStoredContentBlocks(value: unknown): StoredMusicListContentBlock[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap<StoredMusicListContentBlock>((block, index) => {
    if (!block || typeof block !== 'object') return [];
    const candidate = block as Record<string, unknown>;
    const id = typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id
      : `content-block-${index}`;

    if (candidate.type === 'text' && typeof candidate.content === 'string') {
      return [{ id, type: 'text', content: candidate.content }];
    }
    if (candidate.type === 'music' && typeof candidate.musicId === 'string' && candidate.musicId.trim()) {
      return [{ id, type: 'music', musicId: candidate.musicId }];
    }
    return [];
  });
}
