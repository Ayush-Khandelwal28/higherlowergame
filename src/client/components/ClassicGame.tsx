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
  const [picked, setPicked] = React.useState<'left' | 'right' | null>(null);
  const revealed = picked != null; // once user picks we reveal counts
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

  const handlePick = (side: 'left' | 'right') => {
    if (picked) return; // ignore subsequent clicks
    setPicked(side);
    const correct = side === higher;
    setResult({ picked: side, correct });
    if (correct) {
      setScore(s => s + 1);
      setTimeout(() => {
        // prepare next round
        setResult(null);
        setPicked(null);
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
    setPicked(null);
    setRound(0);
    nextRound();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 gap-8 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
      {/* Header / Score Bar */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="relative text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] via-[#ff8717] to-[#ff4500] drop-shadow-sm">
            Subreddit Members Count
          </span>
          <span className="block mt-1 text-xs font-medium text-[#ff4500]/70 tracking-wider">
            Pick the one with MORE subscribers
          </span>
        </h1>
        <div className="flex gap-3 mt-2">
          <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-xs text-[#ff4500]">Score: {score}</div>
          <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-xs text-[#ff4500]">Best: {best}</div>
          {onExit && (
            <button onClick={onExit} className="px-3 py-2 rounded-lg bg-white/70 hover:bg-white/90 transition-colors border border-[#ff4500]/30 text-[10px] font-semibold text-[#ff4500] shadow-sm">Menu</button>
          )}
        </div>
      </div>

      {/* Tiles + VS badge overlay */}
      <div className="relative w-full flex flex-col items-center">
  <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff8717] flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white/70 animate-pulse-glow">
            VS
          </div>
        </div>
        <GameScreen
          key={round}
            left={pair.left}
          right={pair.right}
          picked={picked}
          revealed={revealed}
          onPick={handlePick}
          className="z-20"
        />
  <div className="sm:hidden flex items-center justify-center -mt-2 z-30 pointer-events-none">
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white text-sm font-semibold shadow animate-pulse-glow">
            VS
          </div>
        </div>
      </div>

      {/* Result banner */}
      <div className="h-20 flex items-center justify-center relative w-full z-30">
        {picked && result && (
          <div className="flex items-center gap-3 text-lg font-semibold bg-white/80 backdrop-blur rounded-full px-6 py-2 shadow border border-[#ff4500]/20 animate-pop-in">
            {result.correct ? (
              <span className="inline-flex items-center gap-2 text-green-600 font-bold tracking-wide">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-2xl shadow-sm">✅</span>
                Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-red-600 font-bold tracking-wide">
                <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-2xl shadow-sm">❌</span>
                Nope
              </span>
            )}
          </div>
        )}
      </div>

      {/* Next round indicator */}
      {revealed && !gameOver && result?.correct && (
        <div className="flex flex-col items-center gap-2 z-20 -mt-6">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#ff4500]/80 bg-[#ff4500]/10 px-3 py-1 rounded-full border border-[#ff4500]/20 shadow-sm">
            Next round incoming
          </div>
        </div>
      )}

      {/* Game Over Modal */}
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
