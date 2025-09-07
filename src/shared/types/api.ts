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
