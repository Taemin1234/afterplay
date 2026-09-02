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
