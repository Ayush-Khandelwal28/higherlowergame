import React from 'react';
import type { SubredditInfo } from '../components/GameScreen';

// Raw data shape coming from JSON file
export interface SubredditEntry {
  id: string | null;
  name: string;
  subscribersCount: number | null;
  iconUrl: string | null;
}

export interface UseClassicGameState {
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

export interface UseClassicGameReturn extends UseClassicGameState {
  handlePick: (side: 'left' | 'right') => void;
  resetGame: () => void;
}

const BEST_KEY = 'hl_best';

const toInfo = (e: SubredditEntry): SubredditInfo => ({
  name: e.name,
  subscribers: e.subscribersCount ?? 0,
  icon: e.iconUrl ?? null,
});

export function useClassicGame(entries: SubredditEntry[]): UseClassicGameReturn {
  // filter usable once
  const usable = React.useMemo(
    () => entries.filter(e => typeof e.subscribersCount === 'number' && (e.subscribersCount ?? 0) > 0),
    [entries]
  );

  const pickRandomPair = React.useCallback((): { left: SubredditInfo; right: SubredditInfo } => {
    if (usable.length < 2) {
      const fallback = { name: 'N/A', subscribers: 0 } as SubredditInfo;
      return { left: fallback, right: fallback };
    }
    let i = Math.floor(Math.random() * usable.length);
    let j = Math.floor(Math.random() * usable.length);
    while (j === i) j = Math.floor(Math.random() * usable.length);
    const a = usable[i]!;
    const b = usable[j]!;
    return { left: toInfo(a), right: toInfo(b) };
  }, [usable]);

  const [pair, setPair] = React.useState(() => pickRandomPair());
  const [picked, setPicked] = React.useState<'left' | 'right' | null>(null);
  const [result, setResult] = React.useState<UseClassicGameState['result']>(null);
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

  const nextRound = React.useCallback(() => {
    setPair(pickRandomPair());
    setRound(r => r + 1);
  }, [pickRandomPair]);

  const handlePick = (side: 'left' | 'right') => {
    if (picked || gameOver) return; // ignore once selected or after game ends
    setPicked(side);
    const correct = side === higher;
    setResult({ picked: side, correct });
    if (correct) {
      setScore(s => s + 1);
      // schedule next round after short delay
      window.setTimeout(() => {
        setResult(null);
        setPicked(null);
        nextRound();
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
    nextRound();
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
