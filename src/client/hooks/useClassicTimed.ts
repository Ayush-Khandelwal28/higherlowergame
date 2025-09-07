import React from 'react';
import type { SubredditEntry } from './useMysteryGame';
import type { SubredditInfo } from '../components/GameScreen';

interface UseClassicTimedOptions {
  durationMs: number;
}

export interface UseClassicTimedState {
  base: SubredditInfo;
  challenger: SubredditInfo;
  score: number;
  mistakes: number;
  inRound: boolean; // whether user still needs to guess this pair
  round: number;
  guessResult: { correct: boolean; relation: 'higher' | 'lower' } | null; // last guess outcome until next round
}

export interface UseClassicTimedReturn extends UseClassicTimedState {
  guess: (choice: 'higher' | 'lower') => void;
  next: () => void; // manual advance after correct (optional, auto handled)
  reset: () => void;
}

const toInfo = (e: SubredditEntry): SubredditInfo => ({
  name: e.name,
  subscribers: e.subscribersCount ?? 0,
  icon: e.iconUrl ?? null,
});

export function useClassicTimed(entries: SubredditEntry[], _opts: UseClassicTimedOptions): UseClassicTimedReturn {
  const usable = React.useMemo(
    () => entries.filter(e => typeof e.subscribersCount === 'number' && (e.subscribersCount ?? 0) > 0),
    [entries]
  );

  const randomInfo = React.useCallback((): SubredditInfo => {
    if (!usable.length) return { name: 'N/A', subscribers: 0, icon: null };
    const i = Math.floor(Math.random() * usable.length);
    return toInfo(usable[i]!);
  }, [usable]);

  const [base, setBase] = React.useState<SubredditInfo>(() => randomInfo());
  const [challenger, setChallenger] = React.useState<SubredditInfo>(() => randomInfo());
  const [score, setScore] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [inRound, setInRound] = React.useState(true);
  const [round, setRound] = React.useState(0);
  const [guessResult, setGuessResult] = React.useState<UseClassicTimedState['guessResult']>(null);

  const rollChallenger = React.useCallback(() => {
    if (usable.length < 2) return randomInfo();
    let c = randomInfo();
    let guard = 0;
    while (c.name === base.name && guard < 10) { c = randomInfo(); guard++; }
    return c;
  }, [usable, randomInfo, base.name]);

  const advance = React.useCallback(() => {
    setBase(challenger);
    setChallenger(rollChallenger());
    setRound(r => r + 1);
    setInRound(true);
    setGuessResult(null);
  }, [challenger, rollChallenger]);

  const guess = (choice: 'higher' | 'lower') => {
    if (!inRound) return;
    const relation: 'higher' | 'lower' = challenger.subscribers >= base.subscribers ? 'higher' : 'lower';
    const correct = relation === choice;
    if (correct) {
      setScore(s => s + 1);
    } else {
      setMistakes(m => m + 1);
    }
    setGuessResult({ correct, relation });
    setInRound(false);
    // shorter delay (1s) then advance so user can see number
    window.setTimeout(() => {
      advance();
    }, 1000);
  };

  const next = () => { if (!inRound) advance(); };
  const reset = () => {
    setScore(0);
    setMistakes(0);
    setBase(randomInfo());
    setChallenger(randomInfo());
    setRound(0);
    setInRound(true);
    setGuessResult(null);
  };

  return { base, challenger, score, mistakes, inRound, round, guessResult, guess, next, reset };
}
