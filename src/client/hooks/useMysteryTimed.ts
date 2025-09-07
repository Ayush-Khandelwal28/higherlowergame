import React from 'react';
import type { SubredditEntry } from './useMysteryGame';
import type { SubredditInfo } from '../components/GameScreen';

export interface UseMysteryTimedState {
  left: SubredditInfo;
  right: SubredditInfo;
  picked: 'left' | 'right' | null;
  revealed: boolean;
  score: number;
  mistakes: number;
  round: number;
  result: { picked: 'left' | 'right'; correct: boolean } | null; // persists until next pair load
}

export interface UseMysteryTimedReturn extends UseMysteryTimedState {
  pick: (side: 'left' | 'right') => void;
  reset: () => void;
}

const toInfo = (e: SubredditEntry): SubredditInfo => ({
  name: e.name,
  subscribers: e.subscribersCount ?? 0,
  icon: e.iconUrl ?? null,
});

export function useMysteryTimed(entries: SubredditEntry[]): UseMysteryTimedReturn {
  const usable = React.useMemo(
    () => entries.filter(e => typeof e.subscribersCount === 'number' && (e.subscribersCount ?? 0) > 0),
    [entries]
  );

  const randomInfo = React.useCallback((): SubredditInfo => {
    if (!usable.length) return { name: 'N/A', subscribers: 0, icon: null };
    const i = Math.floor(Math.random() * usable.length);
    return toInfo(usable[i]!);
  }, [usable]);

  const pickDistinct = React.useCallback((exclude: string): SubredditInfo => {
    if (usable.length < 2) return randomInfo();
    let info = randomInfo();
    let guard = 0;
    while (info.name === exclude && guard < 20) { info = randomInfo(); guard++; }
    return info;
  }, [usable, randomInfo]);

  const initialPair = React.useCallback(() => {
    const left = randomInfo();
    const right = pickDistinct(left.name);
    return { left, right };
  }, [randomInfo, pickDistinct]);

  const [pair, setPair] = React.useState(() => initialPair());
  const [picked, setPicked] = React.useState<'left' | 'right' | null>(null);
  const [result, setResult] = React.useState<UseMysteryTimedState['result']>(null);
  const [score, setScore] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [round, setRound] = React.useState(0);

  const higher: 'left' | 'right' = pair.left.subscribers >= pair.right.subscribers ? 'left' : 'right';
  const revealed = picked != null;

  const advance = React.useCallback((winner?: SubredditInfo) => {
    setPair(prev => {
      let carry = winner ?? (prev.left.subscribers >= prev.right.subscribers ? prev.left : prev.right);
      const challenger = pickDistinct(carry.name);
      const placeLeft = Math.random() < 0.5;
      return placeLeft ? { left: carry, right: challenger } : { left: challenger, right: carry };
    });
    setRound(r => r + 1);
  }, [pickDistinct]);

  const pick = (side: 'left' | 'right') => {
    if (picked) return;
    setPicked(side);
    const correct = side === higher;
    setResult({ picked: side, correct });
    if (correct) setScore(s => s + 1); else setMistakes(m => m + 1);
    window.setTimeout(() => {
      const winnerInfo = side === higher ? (side === 'left' ? pair.left : pair.right) : (higher === 'left' ? pair.left : pair.right);
      setPicked(null);
      setResult(null); // clear for next round start
      advance(winnerInfo);
    }, 900); // slight delay for badge animation parity
  };

  const reset = () => {
    setScore(0);
    setMistakes(0);
    setPicked(null);
    setResult(null);
    setRound(0);
    setPair(initialPair());
  };

  return { left: pair.left, right: pair.right, picked, revealed, score, mistakes, round, result, pick, reset };
}
