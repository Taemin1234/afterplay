export type PollItemType = 'TRACK' | 'ALBUM';
export type PollStatus = 'OPEN' | 'CLOSED';

export type PollOptionResult = {
  votesCount: number;
  percentage: number;
};

export type PollOption = {
  id: string;
  order: number;
  spotifyId: string;
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string | null;
  trackId?: string | null;
  albumId?: string | null;
  result: PollOptionResult | null;
};

export type PollComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN';
  };
};

export type ViewerVote = {
  id: string;
  optionId: string;
  createdAt: string;
  updatedAt: string;
};

export type PollListItem = {
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
  viewerVote: ViewerVote | null;
  results: {
    totalVotes: number;
  } | null;
  commentsCount: number;
};

export type PollDetail = PollListItem & {
  updatedAt: string;
  createdBy: {
    id: string;
    nickname: string | null;
    role: 'USER' | 'ADMIN';
  };
  comments: PollComment[];
  relatedPolls: PollListItem[];
  otherPolls: PollListItem[];
};
