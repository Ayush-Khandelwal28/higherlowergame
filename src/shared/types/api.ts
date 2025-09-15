export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type SubredditInfoResponse = {
  type: 'subredditInfo';
  name: string; // queried name
  data: {
    id: string | null;
    name: string | null;
    activeCount: number | null;
    subscribersCount: number | null;
    isNsfw: boolean;
    createdAt: string | null; // ISO timestamp
  iconUrl: string | null;
  };
};

// ---- Leaderboard Types ----
export type LeaderboardMode = 'classic' | 'mystery' | 'timed-classic' | 'timed-mystery' | 'post-won';

export interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number; // 1-based
}

export interface LeaderboardGetResponse {
  type: 'leaderboard';
  mode: LeaderboardMode;
  entries: LeaderboardEntry[]; // sorted by rank asc
  user?: { username: string; score: number; rank: number } | null; // present if user exists on board
  fetchedAt: string; // ISO
}

export interface LeaderboardSubmitResponse {
  type: 'leaderboardSubmit';
  mode: LeaderboardMode;
  accepted: boolean; // true if new high score stored
  previous?: number | null; // previous stored score for user
  best: number; // resulting best after submission (>= previous)
}

// ---- Posts Fetch Types (Versus) ----
export interface PostLite {
  id: string;
  title: string;
  author: string | null;
  permalink: string;
  score: number; // upvotes
  createdUtc: number; // seconds since epoch
  thumbnail?: string | null;
  isStickied?: boolean;
  isNsfw?: boolean;
  isModOrAdmin?: boolean;
}

export interface PostsFetchResponse {
  type: 'posts';
  subreddit: string;
  timeframe: 'day' | 'week' | 'month' | 'year' | 'all';
  source: 'top' | 'hot' | 'new';
  total: number;
  items: PostLite[];
  fetchedAt: string; // ISO timestamp
}
