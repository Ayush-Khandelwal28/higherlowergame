import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse, SubredditInfoResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

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
