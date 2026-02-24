export type FeedKind = "PLAYLIST" | "ALBUM_LIST";
export type ListType = 'all' | 'playlist' | 'albumlist';
export type VisibilityScope = 'all' | 'public' | 'private';

export type MusicListItem = {
  kind: FeedKind;
  id: string;
  title: string;
  story: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  previewImages: string[];
};

export type MusicListResponse = {
  items: MusicListItem[];
  nextCursor: string | null;
};
