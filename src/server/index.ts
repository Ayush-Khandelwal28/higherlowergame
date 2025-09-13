import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { InitResponse, IncrementResponse, DecrementResponse, SubredditInfoResponse, LeaderboardGetResponse, LeaderboardSubmitResponse, LeaderboardMode, PostsFetchResponse, PostLite } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());
// Serve offline data assets (e.g., data/posts.json)
app.use('/data', express.static(path.resolve(process.cwd(), 'data')));

const router = express.Router();

// Helper: construct redis key for a leaderboard mode
const lbKey = (mode: LeaderboardMode) => `lb:${mode}`;
// Allowed modes set for validation
const LB_MODES: LeaderboardMode[] = ['classic', 'mystery', 'timed-classic', 'timed-mystery', 'post-won'];

// Utility: sanitize and map Reddit listing children to PostLite
function mapRedditChildToPostLite(child: any): PostLite | null {
  try {
    const d = child?.data ?? child;
    if (!d || typeof d !== 'object') return null;
    const id: string = d.id ?? d.name ?? '';
    const title: string = d.title ?? '';
    if (!id || !title) return null;
    const thumbnailRaw = typeof d.thumbnail === 'string' ? d.thumbnail : null;
    const thumbnail = thumbnailRaw && /^https?:\/\//i.test(thumbnailRaw) ? thumbnailRaw : null;
    const permalink: string = d.permalink ? `https://www.reddit.com${d.permalink}` : `https://www.reddit.com/comments/${id}`;
    const post: PostLite = {
      id,
      title,
      author: d.author ?? null,
      permalink,
      score: typeof d.score === 'number' ? d.score : 0,
      createdUtc: typeof d.created_utc === 'number' ? d.created_utc : Math.floor(Date.now() / 1000),
      thumbnail,
      isStickied: Boolean(d.stickied || d.pinned),
      isNsfw: Boolean(d.over_18 || d.nsfw),
      isModOrAdmin: Boolean(d.distinguished && d.distinguished !== 'user') || Boolean(d.author_is_mod) || Boolean(d.author_is_blocked),
    };
    return post;
  } catch (_e) {
    return null;
  }
}

// GET /api/posts?subreddit=name&source=top|hot|new&time=day|week|month|year|all&limit=100&minScore=10&includeNsfw=false
router.get<{}, PostsFetchResponse | { status: string; message: string }, {}, {
  subreddit?: string;
  source?: 'top' | 'hot' | 'new';
  time?: 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: string;
  minScore?: string;
  includeNsfw?: string;
}>(
  '/api/posts',
  async (req, res) => {
    try {
      const subreddit = (req.query.subreddit || '').toString().trim();
      if (!subreddit) {
        res.status(400).json({ status: 'error', message: 'subreddit is required' });
        return;
      }
      const source = (req.query.source || 'top') as 'top' | 'hot' | 'new';
      const timeframe = (req.query.time || 'month') as 'day' | 'week' | 'month' | 'year' | 'all';
      const limitNum = Math.max(1, Math.min(1000, parseInt((req.query.limit ?? '200') as string)));
      const minScore = Math.max(0, parseInt((req.query.minScore ?? '10') as string));
      const includeNsfw = (req.query.includeNsfw ?? 'false') === 'true';

      // Prefer offline dataset if present: data/posts.json
      const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');
      if (fs.existsSync(POSTS_FILE)) {
        let json: any = null;
        try {
          json = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
        } catch (e) {
          console.error('Failed to parse data/posts.json', e);
          res.status(500).json({ status: 'error', message: 'failed to read posts dataset' });
          return;
        }
        const all = Array.isArray(json?.entries) ? json.entries : [];
        const subLc = subreddit.toLowerCase();
        // Map to PostLite and filter
        let posts: PostLite[] = all
          .filter((p: any) => (p?.subreddit || '').toLowerCase() === subLc)
          .map((p: any): PostLite | null => {
            if (!p?.id || !p?.title) return null;
            const createdUtc = p.createdAt ? Math.floor(new Date(p.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
            const thumb = typeof p.thumbnail === 'string' && /^https?:\/\//i.test(p.thumbnail) ? p.thumbnail : (typeof p.iconUrl === 'string' && /^https?:\/\//i.test(p.iconUrl) ? p.iconUrl : null);
            return {
              id: p.id,
              title: p.title,
              author: p.author ?? null,
              permalink: p.permalink || (p.url && p.url.startsWith('https://www.reddit.com') ? p.url : `https://www.reddit.com/comments/${p.id}`),
              score: typeof p.score === 'number' ? p.score : 0,
              createdUtc,
              thumbnail: thumb ?? null,
              isStickied: false,
              isNsfw: Boolean(p.isNsfw),
              isModOrAdmin: false,
            };
          })
          .filter(Boolean) as PostLite[];

        // Apply filters
        posts = posts.filter(p => p && (includeNsfw || !p.isNsfw) && p.score >= minScore);
        // Dedup by id and cap
        const seen = new Set<string>();
        const deduped: PostLite[] = [];
        for (const p of posts) { if (!seen.has(p.id)) { seen.add(p.id); deduped.push(p); } }
        const items = deduped.slice(0, limitNum);

        const payload: PostsFetchResponse = {
          type: 'posts',
          subreddit,
          timeframe,
          source,
          total: items.length,
          items,
          fetchedAt: new Date().toISOString(),
        };
        res.json(payload);
        return;
      }

      // Fallback to live Reddit (may be rate-limited)
      const params = new URLSearchParams();
      params.set('limit', String(Math.min(100, limitNum)));
      if (source === 'top') params.set('t', timeframe);
      const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/${source}.json?${params.toString()}`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'higherlowergame/1.0 (+https://github.com/Ayush-Khandelwal28)' } as any });
      if (!resp.ok) {
        res.status(resp.status).json({ status: 'error', message: `reddit http ${resp.status}` });
        return;
      }
      const data: any = await resp.json();
      const children: any[] = data?.data?.children ?? [];
      let posts: PostLite[] = children.map(mapRedditChildToPostLite).filter(Boolean) as PostLite[];
      posts = posts.filter(p => p && !p.isStickied && !p.isModOrAdmin && (includeNsfw || !p.isNsfw) && p.score >= minScore);
      const payload: PostsFetchResponse = {
        type: 'posts',
        subreddit,
        timeframe,
        source,
        total: posts.length,
        items: posts,
        fetchedAt: new Date().toISOString(),
      };
      res.json(payload);
    } catch (error) {
      console.error('posts fetch error', error);
      res.status(500).json({ status: 'error', message: 'failed to fetch posts' });
    }
  }
);

// Submit score (stores only if higher than existing)
router.post<{}, LeaderboardSubmitResponse | { status: string; message: string }, { mode: LeaderboardMode; score: number }>(
  '/api/leaderboard/submit',
  async (req, res) => {
    try {
  const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(400).json({ status: 'error', message: 'username unavailable (not logged in?)' });
        return;
      }
      const { mode, score } = req.body || {};
      if (!LB_MODES.includes(mode)) {
        res.status(400).json({ status: 'error', message: 'invalid mode' });
        return;
      }
      if (typeof score !== 'number' || score < 0) {
        res.status(400).json({ status: 'error', message: 'invalid score' });
        return;
      }
      const key = lbKey(mode);
      const existingRaw = await redis.zScore(key, username);
      const existing = existingRaw == null ? null : existingRaw;
      let accepted = false;
      if (existing == null || score > existing) {
        // store new score
        await redis.zAdd(key, { score, member: username });
        accepted = true;
      }
      const best = accepted ? score : (existing ?? 0);
      const payload: LeaderboardSubmitResponse = {
        type: 'leaderboardSubmit',
        mode,
        accepted,
        previous: existing,
        best,
      };
      res.json(payload);
    } catch (error) {
      console.error('Leaderboard submit error', error);
      res.status(500).json({ status: 'error', message: 'failed to submit score' });
    }
  }
);

// Fetch leaderboard (top N + current user)
router.get<{}, LeaderboardGetResponse | { status: string; message: string }, {}, { mode: LeaderboardMode; limit?: string }>(
  '/api/leaderboard',
  async (req, res) => {
    try {
      const mode = req.query.mode as LeaderboardMode;
      if (!LB_MODES.includes(mode)) {
        res.status(400).json({ status: 'error', message: 'invalid mode' });
        return;
      }
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit ?? '25')));
      const key = lbKey(mode);
      // Get top entries (highest score) using reverse range
      // No helper for withScores, so fetch a wide range then pipeline scores individually.
      // First get all members, then slice last N.
      const rawMembers: any = await redis.zRange(key, 0, -1);
      // Some redis client typings may return array of strings; normalize.
      const allMembers: string[] = Array.isArray(rawMembers)
        ? rawMembers.map((m: any) => typeof m === 'string' ? m : m?.member).filter(Boolean)
        : [];
      const sliced = allMembers.slice(-limit); // lowest..highest, so slice end
      // Fetch scores for sliced members
      const scores: number[] = [];
      for (const m of sliced) {
        const sc = await redis.zScore(key, m);
        scores.push(sc ?? 0);
      }
      // Pair and sort descending
      const paired = sliced.map((m, idx) => ({ member: m, score: scores[idx] ?? 0 }));
      paired.sort((a, b) => b.score - a.score);
      const top = paired.map((p, i) => ({ username: p.member, score: p.score, rank: i + 1 }));
      let user: LeaderboardGetResponse['user'] = null;
      const username = await reddit.getCurrentUsername();
      if (username) {
        const score = await redis.zScore(key, username);
        if (score != null) {
          // Determine rank: count how many have higher score
          const rawForRank: any = await redis.zRange(key, 0, -1);
          const membersForRank: string[] = Array.isArray(rawForRank)
            ? rawForRank.map((m: any) => typeof m === 'string' ? m : m?.member).filter(Boolean)
            : [];
          let higher = 0;
          for (const m of membersForRank) {
            if (m === username) continue;
            const sc = await redis.zScore(key, m);
            if ((sc ?? 0) > score) higher++;
          }
          user = { username, score, rank: higher + 1 };
        }
      }
      const payload: LeaderboardGetResponse = {
        type: 'leaderboard',
        mode,
        entries: top,
        user,
        fetchedAt: new Date().toISOString(),
      };
      res.json(payload);
    } catch (error) {
      console.error('Leaderboard fetch error', error);
      res.status(500).json({ status: 'error', message: 'failed to fetch leaderboard' });
    }
  }
);

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Fetch subreddit info by name
router.get<{
  name: string;
}, SubredditInfoResponse | { status: string; message: string }>(
  '/api/subreddit/:name',
  async (req, res): Promise<void> => {
    const { name } = req.params;
    if (!name) {
      res.status(400).json({ status: 'error', message: 'subreddit name is required' });
      return;
    }

    try {
      // Prefer the newer getSubredditInfoByName if available, else fall back
      const anyReddit: any = reddit as any;
      // Fetch primary info (SubredditInfo) first
      let info: any = null;
      if (typeof anyReddit.getSubredditInfoByName === 'function') {
        info = await anyReddit.getSubredditInfoByName(name);
      }

      // Attempt to fetch full Subreddit object (needed for settings -> communityIcon)
      let subredditObj: any = null;
      if (typeof anyReddit.getSubredditByName === 'function') {
        try {
          subredditObj = await anyReddit.getSubredditByName(name);
        } catch (_e) {
          // ignore if not accessible
        }
      }

      if (!info && subredditObj) {
        // Derive a minimal info structure from Subreddit instance if info endpoint unavailable
        const json = typeof subredditObj.toJSON === 'function' ? subredditObj.toJSON() : subredditObj;
        info = {
          id: json?.id,
          name: json?.name,
          activeCount: json?.numberOfActiveUsers,
          subscribersCount: json?.numberOfSubscribers,
          isNsfw: json?.nsfw,
          createdAt: json?.createdAt,
        };
      }

      if (!info) {
        throw new Error('Subreddit not found');
      }

      // Extract icon from settings if possible
      let iconUrl: string | null = null;
      const settings = subredditObj?.settings;
      if (settings) {
        iconUrl =
          settings.communityIcon ||
          settings.bannerImage ||
          settings.mobileBannerImage ||
          settings.bannerBackgroundImage ||
          null;
      }

      res.json({
        type: 'subredditInfo',
        name,
        data: {
          id: info?.id ?? null,
          name: info?.name ?? info?.displayName ?? null,
          activeCount: info?.activeCount ?? info?.numberOfActiveUsers ?? null,
          subscribersCount: info?.subscribersCount ?? info?.numberOfSubscribers ?? null,
          isNsfw: Boolean(info?.isNsfw ?? info?.nsfw),
          createdAt: info?.createdAt
            ? (info.createdAt instanceof Date
                ? info.createdAt.toISOString()
                : new Date(info.createdAt).toISOString())
            : null,
          iconUrl,
        },
      });
    } catch (error) {
      console.error(`Error fetching subreddit info for ${name}:`, error);
      let message = 'Failed to fetch subreddit info';
      if (error instanceof Error) message = message + ': ' + error.message;
      res.status(400).json({ status: 'error', message });
    }
  }
);

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
