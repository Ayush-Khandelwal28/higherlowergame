import React from 'react';
import type { PostLite } from '../../shared/types/api';
import pictureData from '../../../data/picture_posts.json';

export interface WhichPostOptions {
  minScore?: number;
  constrainPercent?: number; // e.g., 0.2 for ±20% pairing window; undefined disables
  /** Minimum ratio between higher and lower scores. Example: 2 means one is ≥ 2x the other */
  minRatio?: number;
}

export interface WhichPostState {
  base: PostLite | null; // shown with score
  challenger: PostLite | null; // hidden score until guess
  guessed: boolean;
  guessResult: { correct: boolean; relation: 'higher' | 'lower' } | null;
  score: number;
  best: number;
  gameOver: boolean;
  round: number;
  loading: boolean;
  error: string | null;
}

export interface WhichPostReturn extends WhichPostState {
  start: (subreddit: string) => void;
  guess: (choice: 'higher' | 'lower') => void;
  reset: () => void;
}

const BEST_KEY = 'hl_best_postwon';
const HISTORY_LIMIT = 8;

function pairWithin(posts: PostLite[], anchor: PostLite, pct: number, exclude?: Set<string>): PostLite | null {
  const a = Math.max(1, anchor.score);
  const lo = Math.floor(a * (1 - pct));
  const hi = Math.ceil(a * (1 + pct));
  const candidates = posts.filter(p => p.id !== anchor.id && (!exclude || !exclude.has(p.id)) && p.score >= lo && p.score <= hi);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

function pairWithMinRatio(posts: PostLite[], anchor: PostLite, ratio: number, exclude?: Set<string>): PostLite | null {
  const a = Math.max(1, anchor.score);
  const lo = Math.floor(a / Math.max(1.0001, ratio));
  const hi = Math.ceil(a * ratio);
  const candidates = posts.filter(p => p.id !== anchor.id && (!exclude || !exclude.has(p.id)) && (p.score <= lo || p.score >= hi));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export function useWhichPostWon(opts?: Partial<WhichPostOptions>): WhichPostReturn {
  const defaults: WhichPostOptions = {
    minScore: 10,
    // constrainPercent: 0.2,
    minRatio: 2,
  };
  const config = { ...defaults, ...(opts || {}) };

  const [posts, setPosts] = React.useState<PostLite[]>([]);
  const [state, setState] = React.useState<WhichPostState>({
    base: null,
    challenger: null,
    guessed: false,
    guessResult: null,
    score: 0,
    best: (typeof window !== 'undefined' ? parseInt(window.localStorage.getItem(BEST_KEY) || '0') : 0) || 0,
    gameOver: false,
    round: 0,
    loading: false,
    error: null,
  });

  const recentIdsRef = React.useRef<string[]>([]);

  const fetchPosts = React.useCallback(async (subreddit: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const entries: any[] = Array.isArray((pictureData as any)?.entries) ? (pictureData as any).entries : [];
      const subLc = subreddit.toLowerCase();
      let items: PostLite[] = entries
        .filter(p => (p?.subreddit || '').toLowerCase() === subLc)
        .map((p): PostLite | null => {
          if (!p?.id || !p?.title) return null;
          const createdUtc = p.createdAt ? Math.floor(new Date(p.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
          const thumbCand = (p as any).imageUrl ?? (p as any).thumbnail ?? (p as any).iconUrl ?? null;
          const thumb = typeof thumbCand === 'string' && /^https?:\/\//i.test(thumbCand) ? thumbCand : null;
          return {
            id: p.id,
            title: p.title,
            author: p.author ?? null,
            permalink: p.permalink || (p.url && typeof p.url === 'string' && p.url.startsWith('https://www.reddit.com') ? p.url : `https://www.reddit.com/comments/${p.id}`),
            score: typeof p.score === 'number' ? p.score : 0,
            createdUtc,
            thumbnail: thumb ?? null,
            isStickied: false,
            isNsfw: Boolean(p.isNsfw),
            isModOrAdmin: false,
          };
        })
        .filter(Boolean) as PostLite[];

      // Additional filters: image-only, remove duplicates, ensure min score
      const seen = new Set<string>();
      items = items.filter(p => !!p.thumbnail && /^https?:\/\//i.test(p.thumbnail) && p.score >= (config.minScore || 0) && !seen.has(p.id) && (seen.add(p.id), true));
      // Keep up to 200
      items = items.slice(0, 200);
      setPosts(items);
      setState(s => ({ ...s, loading: false, error: items.length < 2 ? 'Not enough image posts found' : null }));
      return items;
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: 'Failed to load offline posts data' }));
      return [] as PostLite[];
    }
  }, [config.minScore]);

  const pickRandom = React.useCallback((arr: PostLite[]) => arr[Math.floor(Math.random() * arr.length)]!, []);

  const pickRandomExcluding = React.useCallback((arr: PostLite[], exclude?: Set<string>) => {
    if (!exclude || exclude.size === 0) return pickRandom(arr);
    const candidates = arr.filter(p => !exclude.has(p.id));
    const pool = candidates.length ? candidates : arr;
    return pickRandom(pool);
  }, [pickRandom]);

  const nextRound = React.useCallback((carryBase?: PostLite, poolOverride?: PostLite[]) => {
    setState(prev => {
      const pool = poolOverride ?? posts;
      if (pool.length < 2) return prev; // can't progress
      let base = carryBase || pickRandomExcluding(pool, new Set(recentIdsRef.current));
      let challenger: PostLite | null = null;
      const tryFind = (b: PostLite, exclude?: Set<string>): PostLite | null => {
        if (config.minRatio != null && config.minRatio > 1) {
          const c = pairWithMinRatio(pool, b, config.minRatio, exclude);
          if (c) return c;
          return pairWithMinRatio(pool, b, config.minRatio);
        }
        if (config.constrainPercent != null && config.constrainPercent > 0) {
          const c = pairWithin(pool, b, config.constrainPercent, exclude);
          if (c) return c;
          return pairWithin(pool, b, config.constrainPercent);
        }
        if (exclude && exclude.size) {
          const cand = pool.filter(p => p.id !== b.id && !exclude.has(p.id));
          if (cand.length) return pickRandom(cand);
        }
        return pickRandom(pool.filter(p => p.id !== b.id));
      };
      const exclude = new Set<string>([...recentIdsRef.current, base.id]);
      challenger = tryFind(base, exclude);
      if (!challenger) {
        // Try a handful of alternate bases to satisfy constraints
        let attempts = 0;
        while (!challenger && attempts++ < 12) {
          const alt = pickRandomExcluding(pool, new Set(recentIdsRef.current));
          const c = tryFind(alt, new Set<string>([...recentIdsRef.current, alt.id]));
          if (c) {
            base = alt;
            challenger = c;
            break;
          }
        }
        // Fallback to random if no constrained pair found
        if (!challenger) {
          const cand = pool.filter(p => p.id !== base.id && !recentIdsRef.current.includes(p.id));
          challenger = cand.length ? pickRandom(cand) : pickRandom(pool.filter(p => p.id !== base.id));
        }
      }
      // Ensure distinct
      let guard = 0;
      while (challenger.id === base.id && guard++ < 10) challenger = pickRandom(pool.filter(p => p.id !== base.id));

      const rec = recentIdsRef.current;
      rec.push(base.id, challenger.id);
      const max = HISTORY_LIMIT * 2;
      if (rec.length > max) rec.splice(0, rec.length - max);
      return {
        ...prev,
        base,
        challenger,
        guessed: false,
        guessResult: null,
        round: prev.round + 1,
      };
    });
  }, [posts, pickRandom, pickRandomExcluding, config.constrainPercent, config.minRatio]);

  const start = React.useCallback(async (subreddit: string) => {
    const items = await fetchPosts(subreddit);
    if (items.length >= 2) {
      recentIdsRef.current = [];
      setState(s => ({ ...s, score: 0, gameOver: false }));
      nextRound(undefined, items);
    }
  }, [fetchPosts, nextRound]);

  const guess = (choice: 'higher' | 'lower') => {
    setState(prev => {
      if (prev.guessed || prev.gameOver || !prev.base || !prev.challenger) return prev;
      const relation: 'higher' | 'lower' = prev.challenger.score >= prev.base.score ? 'higher' : 'lower';
      const correct = relation === choice;
      const guessResult = { correct, relation };
      if (correct) {
        const carry = prev.challenger;
        window.setTimeout(() => nextRound(carry), 2000);
        return { ...prev, guessed: true, guessResult, score: prev.score + 1 };
      } else {
        window.setTimeout(() => {
          setState(s => {
            const newBest = Math.max(s.best, s.score);
            try { window.localStorage.setItem(BEST_KEY, String(newBest)); } catch {}
            return { ...s, gameOver: true, best: newBest };
          });
        }, 2000);
        return { ...prev, guessed: true, guessResult };
      }
    });
  };

  const reset = () => {
    recentIdsRef.current = [];
    setState(s => ({ ...s, score: 0, gameOver: false, guessed: false, guessResult: null, round: 0 }));
    if (posts.length >= 2) nextRound();
  };

  return { ...state, start, guess, reset };
}
