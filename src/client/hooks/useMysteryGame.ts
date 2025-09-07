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

  // Helpers for random selection
  const pickRandomInfo = React.useCallback((): SubredditInfo => {
    if (!usable.length) return { name: 'N/A', subscribers: 0, icon: null };
    const i = Math.floor(Math.random() * usable.length);
    return toInfo(usable[i]!);
  }, [usable]);

  const pickDistinctFrom = React.useCallback((excludeName: string): SubredditInfo => {
    if (usable.length < 2) return pickRandomInfo();
    let guard = 0;
    let info = pickRandomInfo();
    while (info.name === excludeName && guard < 20) { info = pickRandomInfo(); guard++; }
    return info;
  }, [usable, pickRandomInfo]);

  const pickInitialPair = React.useCallback((): { left: SubredditInfo; right: SubredditInfo } => {
    const left = pickRandomInfo();
    const right = pickDistinctFrom(left.name);
    return { left, right };
  }, [pickRandomInfo, pickDistinctFrom]);

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

  // Advance to next round carrying over the previous winner subreddit
  const nextRound = React.useCallback((winner?: SubredditInfo) => {
    setPair(prev => {
      let carry = winner;
      if (!carry) {
        // Fallback: choose higher of current pair or random if invalid
        const higherSub = prev.left.subscribers >= prev.right.subscribers ? prev.left : prev.right;
        carry = higherSub;
      }
      const challenger = pickDistinctFrom(carry.name);
      // Randomize side to avoid player bias
      const placeLeft = Math.random() < 0.5;
      return placeLeft ? { left: carry, right: challenger } : { left: challenger, right: carry };
    });
    setRound(r => r + 1);
  }, [pickDistinctFrom]);

  const handlePick = (side: 'left' | 'right') => {
    if (picked || gameOver) return; // ignore once selected or after game ends
    setPicked(side);
    const correct = side === higher;
    setResult({ picked: side, correct });
    if (correct) {
      const winnerInfo = side === 'left' ? pair.left : pair.right;
      setScore(s => s + 1);
      // schedule next round after short delay with winner carried over
      window.setTimeout(() => {
        setResult(null);
        setPicked(null);
        nextRound(winnerInfo);
      }, 1200);
    } else {
      setGameOver(true);
      window.setTimeout(() => setResult(null), 1500);
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
    // Recreate an initial fresh pair (both random) then advance by treating left as winner for continuity
    const initial = pickInitialPair();
    setPair(initial);
  };

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
