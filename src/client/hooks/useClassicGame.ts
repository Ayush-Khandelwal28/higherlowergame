import React from 'react';
import type { SubredditEntry } from './useMysteryGame';
import type { SubredditInfo } from '../components/GameScreen';

export interface UseClassicGameState {
  base: SubredditInfo; // shown with subscribers
  challenger: SubredditInfo; // hidden subscribers until guess
  score: number;
  best: number;
  gameOver: boolean;
  guessed: boolean; // whether current round has been guessed
  guessResult: { correct: boolean; relation: 'higher' | 'lower'; } | null;
  round: number;
}

export interface UseClassicGameReturn extends UseClassicGameState {
  guess: (choice: 'higher' | 'lower') => void;
  next: () => void; // advance after correct guess
  reset: () => void;
}

const BEST_KEY_CLASSIC = 'hl_best_classic';

const toInfo = (e: SubredditEntry): SubredditInfo => ({
  name: e.name,
  subscribers: e.subscribersCount ?? 0,
  icon: e.iconUrl ?? null,
});

export function useClassicGame(entries: SubredditEntry[]): UseClassicGameReturn {
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
  const [best, setBest] = React.useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = window.localStorage.getItem(BEST_KEY_CLASSIC);
    return stored ? parseInt(stored) : 0;
  });
  const [gameOver, setGameOver] = React.useState(false);
  const [guessed, setGuessed] = React.useState(false);
  const [guessResult, setGuessResult] = React.useState<UseClassicGameState['guessResult']>(null);
  const [round, setRound] = React.useState(0);

  // ensure challenger differs from base
  const rollChallenger = React.useCallback(() => {
    if (usable.length < 2) return randomInfo();
    let c = randomInfo();
    let guard = 0;
    while (c.name === base.name && guard < 10) { c = randomInfo(); guard++; }
    return c;
  }, [usable, randomInfo, base.name]);

  const startRound = React.useCallback(() => {
    setChallenger(rollChallenger());
    setGuessed(false);
    setGuessResult(null);
    setRound(r => r + 1);
  }, [rollChallenger]);

  const guess = (choice: 'higher' | 'lower') => {
    if (guessed || gameOver) return;
    const relation: 'higher' | 'lower' = challenger.subscribers >= base.subscribers ? 'higher' : 'lower';
    const correct = relation === choice;
    setGuessed(true);
    setGuessResult({ correct, relation });
    if (correct) {
      setScore(s => s + 1);
      // promote challenger to new base after short delay, then start next round
      window.setTimeout(() => {
        setBase(challenger);
        startRound();
      }, 1200);
    } else {
      setGameOver(true);
      // update best if needed
      setBest(prev => {
        const newBest = score > prev ? score : prev;
        if (newBest !== prev) {
          try { window.localStorage.setItem(BEST_KEY_CLASSIC, String(newBest)); } catch {}
        }
        return newBest;
      });
    }
  };

  const next = () => {
    if (!guessed || !guessResult?.correct) return;
    setBase(challenger);
    startRound();
  };

  const reset = () => {
    setScore(0);
    setGameOver(false);
    setBase(randomInfo());
    setChallenger(randomInfo());
    setGuessed(false);
    setGuessResult(null);
    setRound(0);
    startRound();
  };

  return {
    base,
    challenger,
    score,
    best,
    gameOver,
    guessed,
    guessResult,
    round,
    guess,
    next,
    reset,
  };
}
