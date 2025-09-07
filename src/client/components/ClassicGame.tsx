import React from 'react';
import { GameScreen, SubredditInfo } from './GameScreen';
import subredditsData from '../../../data/subreddits.json';

interface SubredditEntry {
  id: string | null;
  name: string;
  subscribersCount: number | null;
  iconUrl: string | null;
}

interface ClassicGameProps {
  onExit?: () => void; // optional back handler
}

export const ClassicGame: React.FC<ClassicGameProps> = ({ onExit }) => {
  const allEntries = (subredditsData as any).entries as SubredditEntry[];
  const usable = React.useMemo(
    () => allEntries.filter(e => typeof e.subscribersCount === 'number' && (e.subscribersCount ?? 0) > 0),
    [allEntries]
  );

  const [result, setResult] = React.useState<{ picked: 'left' | 'right'; correct: boolean } | null>(null);
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('hl_best') : null;
    return stored ? parseInt(stored) : 0;
  });
  const [gameOver, setGameOver] = React.useState(false);
  const [round, setRound] = React.useState(0);

  const pickRandomPair = React.useCallback((): { left: SubredditInfo; right: SubredditInfo } => {
    if (usable.length < 2) return { left: { name: 'N/A', subscribers: 0 }, right: { name: 'N/A', subscribers: 0 } };
    let i = Math.floor(Math.random() * usable.length);
    let j = Math.floor(Math.random() * usable.length);
    while (j === i) j = Math.floor(Math.random() * usable.length);
    const a = usable[i]!;
    const b = usable[j]!;
    return {
      left: { name: a.name, subscribers: a.subscribersCount ?? 0, icon: a.iconUrl ?? null },
      right: { name: b.name, subscribers: b.subscribersCount ?? 0, icon: b.iconUrl ?? null }
    };
  }, [usable]);

  const [pair, setPair] = React.useState(() => pickRandomPair());
  const higher: 'left' | 'right' = pair.left.subscribers >= pair.right.subscribers ? 'left' : 'right';

  const nextRound = React.useCallback(() => {
    setPair(pickRandomPair());
    setRound(r => r + 1);
  }, [pickRandomPair]);

  const handleGuess = (picked: 'left' | 'right', correct: boolean) => {
    setResult({ picked, correct });
    if (correct) {
      setScore(s => s + 1);
      setTimeout(() => {
        setResult(null);
        nextRound();
      }, 1200);
    } else {
      setGameOver(true);
      setTimeout(() => {
        setResult(null);
      }, 1500);
    }
  };

  React.useEffect(() => {
    if (gameOver) {
      setBest(prev => {
        const newBest = score > prev ? score : prev;
        if (newBest !== prev) {
          try { window.localStorage.setItem('hl_best', String(newBest)); } catch {}
        }
        return newBest;
      });
    }
  }, [gameOver, score]);

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setResult(null);
    setRound(0);
    nextRound();
  };

  return (
    <div className="relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 z-30">
        <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-sm text-[#ff4500]">Score: {score}</div>
        <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-sm text-[#ff4500]">Best: {best}</div>
        {onExit && (
          <button onClick={onExit} className="px-3 py-2 rounded-lg bg-white/70 hover:bg-white/90 transition-colors border border-[#ff4500]/30 text-xs font-semibold text-[#ff4500] shadow-sm">Menu</button>
        )}
      </div>
      <GameScreen
        key={round}
        left={pair.left}
        right={pair.right}
        higher={higher}
        onGuess={handleGuess}
        result={result}
      />
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 w-[min(90%,360px)] shadow-xl border border-[#ff4500]/30 animate-pop-in">
            <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] to-[#ff8717]">Game Over</h2>
            <p className="text-sm text-[#444]">Final Score: <span className="font-bold text-[#ff4500]">{score}</span></p>
            <button onClick={resetGame} className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white font-semibold shadow hover:shadow-md transition-all">Play Again</button>
            {onExit && (
              <button onClick={onExit} className="text-xs text-[#ff4500] underline mt-1">Back to Menu</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
