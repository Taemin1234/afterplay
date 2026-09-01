export interface MusicContentItem {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
}

export interface TextContentBlock {
  id: string;
  type: 'text';
  content: string;
}

export interface MusicContentBlock {
  id: string;
  type: 'music';
  item: MusicContentItem;
}

export type MusicListContentBlock = TextContentBlock | MusicContentBlock;

export interface StoredTextContentBlock {
  id: string;
  type: 'text';
  content: string;
}

export interface StoredMusicContentBlock {
  id: string;
  type: 'music';
  musicId: string;
}

export type StoredMusicListContentBlock = StoredTextContentBlock | StoredMusicContentBlock;

export function parseStoredContentBlocks(value: unknown): StoredMusicListContentBlock[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap<StoredMusicListContentBlock>((block, index) => {
    if (!block || typeof block !== 'object') return [];
    const candidate = block as Record<string, unknown>;
    const id = typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id
      : `content-block-${index}`;

    if (candidate.type === 'text' && typeof candidate.content === 'string') {
      return [{ id, type: 'text' as const, content: candidate.content }];
    }
    if (candidate.type === 'music' && typeof candidate.musicId === 'string' && candidate.musicId.trim()) {
      return [{ id, type: 'music' as const, musicId: candidate.musicId }];
    }
    return [];
  });
}
