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

  // History-aware random picker to avoid immediate repeats
  const recentNamesRef = React.useRef<string[]>([]);

  const pickRandomExcluding = React.useCallback((exclude: Set<string>): SubredditInfo => {
    if (!usable.length) return { name: 'N/A', subscribers: 0, icon: null };
    const candidates = usable.filter(e => !exclude.has(e.name));
    const pool = candidates.length > 0 ? candidates : usable;
    const i = Math.floor(Math.random() * pool.length);
    return toInfo(pool[i]!);
  }, [usable]);

  const initialPair = React.useCallback(() => {
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

  const [pair, setPair] = React.useState(() => initialPair());
  const [picked, setPicked] = React.useState<'left' | 'right' | null>(null);
  const [result, setResult] = React.useState<UseMysteryTimedState['result']>(null);
  const [score, setScore] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [round, setRound] = React.useState(0);

  const higher: 'left' | 'right' = pair.left.subscribers >= pair.right.subscribers ? 'left' : 'right';
  const revealed = picked != null;

  // Advance with two fresh tiles each round (no carryover)
  const advance = React.useCallback(() => {
    setPair(() => initialPair());
    setRound(r => r + 1);
  }, [initialPair]);

  const pick = (side: 'left' | 'right') => {
    if (picked) return;
    setPicked(side);
    const correct = side === higher;
    setResult({ picked: side, correct });
    if (correct) setScore(s => s + 1); else setMistakes(m => m + 1);
    window.setTimeout(() => {
      setPicked(null);
      setResult(null); // clear for next round start
      advance();
    }, 900); // slight delay for badge animation parity
  };

  const reset = () => {
    setScore(0);
    setMistakes(0);
    setPicked(null);
    setResult(null);
    setRound(0);
    recentNamesRef.current = [];
    setPair(initialPair());
  };

  // Add to recent history and trim
  React.useEffect(() => {
    const arr = recentNamesRef.current;
    arr.push(pair.left.name, pair.right.name);
    const max = 16; // HISTORY_LIMIT * 2; keep local to avoid cross-file import
    if (arr.length > max) {
      arr.splice(0, arr.length - max);
    }
  }, [pair.left.name, pair.right.name]);

  return { left: pair.left, right: pair.right, picked, revealed, score, mistakes, round, result, pick, reset };
}
