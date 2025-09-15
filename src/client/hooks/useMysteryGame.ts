import React from 'react';
import type { SubredditInfo } from '../components/GameScreen';

// Raw data shape coming from JSON file
export interface SubredditEntry {
  id: string | null;
  name: string;
  subscribersCount: number | null;
  iconUrl: string | null;
}

export interface UseMysteryGameState {
  left: SubredditInfo;
  right: SubredditInfo;
  picked: 'left' | 'right' | null;
  revealed: boolean;
  score: number;
  best: number;
  gameOver: boolean;
  result: { picked: 'left' | 'right'; correct: boolean } | null;
  round: number;
}

export interface UseMysteryGameReturn extends UseMysteryGameState {
  handlePick: (side: 'left' | 'right') => void;
  resetGame: () => void;
}

const BEST_KEY = 'hl_best';
const HISTORY_LIMIT = 8; // prevent immediate repeats across recent rounds

const toInfo = (e: SubredditEntry): SubredditInfo => ({
  name: e.name,
  subscribers: e.subscribersCount ?? 0,
  icon: e.iconUrl ?? null,
});

export function useMysteryGame(entries: SubredditEntry[]): UseMysteryGameReturn {
  // filter usable once
  const usable = React.useMemo(
    () => entries.filter(e => typeof e.subscribersCount === 'number' && (e.subscribersCount ?? 0) > 0),
    [entries]
  );

  // History-aware random picker that avoids recently shown subreddit names

  // History-aware random picker that avoids recently shown subreddit names
  const pickRandomExcluding = React.useCallback((exclude: Set<string>): SubredditInfo => {
    if (!usable.length) return { name: 'N/A', subscribers: 0, icon: null };
    const candidates = usable.filter(e => !exclude.has(e.name));
    const pool = candidates.length > 0 ? candidates : usable; // fallback if all excluded
    const i = Math.floor(Math.random() * pool.length);
    return toInfo(pool[i]!);
  }, [usable]);

  const recentNamesRef = React.useRef<string[]>([]);

  const pickInitialPair = React.useCallback((): { left: SubredditInfo; right: SubredditInfo } => {
    const exclude = new Set(recentNamesRef.current);
    let left = pickRandomExcluding(exclude);
    exclude.add(left.name);
    let right = pickRandomExcluding(exclude);
    if (right.name === left.name) {
      exclude.add(right.name);
      right = pickRandomExcluding(exclude);
    }
    return { left, right };
  }, [pickRandomExcluding]);

  const [pair, setPair] = React.useState(() => pickInitialPair());
  const [picked, setPicked] = React.useState<'left' | 'right' | null>(null);
  const [result, setResult] = React.useState<UseMysteryGameState['result']>(null);
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = window.localStorage.getItem(BEST_KEY);
    return stored ? parseInt(stored) : 0;
  });
  const [gameOver, setGameOver] = React.useState(false);
  const [round, setRound] = React.useState(0);

  // compute which side is actually higher for current pair
  const higher: 'left' | 'right' = pair.left.subscribers >= pair.right.subscribers ? 'left' : 'right';
  const revealed = picked != null;

  // Advance to next round with two fresh tiles (no carryover)
  const nextRound = React.useCallback(() => {
    setPair(() => pickInitialPair());
    setRound(r => r + 1);
  }, [pickInitialPair]);

  const handlePick = (side: 'left' | 'right') => {
    if (picked || gameOver) return; // ignore once selected or after game ends
    setPicked(side);
    const correct = side === higher;
    setResult({ picked: side, correct });
    if (correct) {
      setScore(s => s + 1);
      // Keep numbers visible for 2s before advancing
      window.setTimeout(() => {
        setResult(null);
        setPicked(null);
        nextRound();
      }, 2000);
    } else {
      // Delay game over overlay 2s so user can read counts
      window.setTimeout(() => {
        setGameOver(true);
        setResult(null);
      }, 2000);
    }
  };

  // persist best score when game ends
  React.useEffect(() => {
    if (!gameOver) return;
    setBest(prev => {
      const newBest = score > prev ? score : prev;
      if (newBest !== prev) {
        try { window.localStorage.setItem(BEST_KEY, String(newBest)); } catch {}
      }
      return newBest;
    });
  }, [gameOver, score]);

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setResult(null);
    setPicked(null);
    setRound(0);
    // Clear recent history and create a fresh pair
    recentNamesRef.current = [];
    setPair(pickInitialPair());
  };

  // Maintain recent history of shown subreddit names
  React.useEffect(() => {
    const arr = recentNamesRef.current;
    arr.push(pair.left.name, pair.right.name);
    const max = HISTORY_LIMIT * 2;
    if (arr.length > max) {
      arr.splice(0, arr.length - max);
    }
  }, [pair.left.name, pair.right.name]);

  return {
    left: pair.left,
    right: pair.right,
    picked,
    revealed,
    score,
    best,
    gameOver,
    result,
    round,
    handlePick,
    resetGame,
  };
}
