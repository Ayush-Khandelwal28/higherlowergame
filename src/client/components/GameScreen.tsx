import React, { useEffect, useState } from 'react';
import { SubredditCard } from './SubredditCard';

export interface SubredditInfo {
  name: string; // without r/
  icon?: string | null;
  subscribers: number; // actual count
}

interface GameScreenProps {
  left: SubredditInfo;
  right: SubredditInfo;
  onGuess: (picked: 'left' | 'right', correct: boolean) => void;
  // Which one is actually higher (can be computed externally)
  higher: 'left' | 'right';
  result?: { picked: 'left' | 'right'; correct: boolean } | null;
  loading?: boolean;
}

export const GameScreen: React.FC<GameScreenProps> = ({ left, right, onGuess, higher, result, loading }) => {
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    // reset when props change (new round)
    setRevealed(false);
    setPicked(null);
  }, [left.name, right.name]);

  const handlePick = (side: 'left' | 'right') => {
    if (revealed || loading) return;
    const correct = side === higher;
    setPicked(side);
    setRevealed(true);
    onGuess(side, correct);
  };

  const showResult = revealed && picked && result;

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 gap-8 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
      <h1 className="relative text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] via-[#ff8717] to-[#ff4500] drop-shadow-sm">
          Subreddit Members Count
        </span>
        <span className="block mt-1 text-xs font-medium text-[#ff4500]/70 tracking-wider">
          Pick the one with MORE subscribers
        </span>
      </h1>

      <div className="w-full flex flex-col sm:flex-row gap-6 max-w-5xl relative">
        {/* VS Badge (always present, lower z than results & modals) */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff8717] flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white/70 animate-pulse-glow">
            VS
          </div>
        </div>
        <SubredditCard
          side="left"
          data={left}
          selected={picked === 'left'}
          dim={revealed && picked === 'right'}
          revealed={revealed}
          onClick={() => handlePick('left')}
        />
        <SubredditCard
          side="right"
            data={right}
          selected={picked === 'right'}
          dim={revealed && picked === 'left'}
          revealed={revealed}
          onClick={() => handlePick('right')}
        />
        {/* Mobile VS badge */}
        <div className="sm:hidden flex items-center justify-center -mt-2 z-10 pointer-events-none">
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white text-sm font-semibold shadow animate-pulse-glow">
            VS
          </div>
        </div>
      </div>

  <div className="h-20 flex items-center justify-center relative w-full z-20">
        {showResult && (
          <div className="flex items-center gap-3 text-lg font-semibold bg-white/80 backdrop-blur rounded-full px-6 py-2 shadow border border-[#ff4500]/20 animate-pop-in">
              {result?.correct ? (
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

      {revealed && (
        <div className="flex flex-col items-center gap-2 z-20">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#ff4500]/80 bg-[#ff4500]/10 px-3 py-1 rounded-full border border-[#ff4500]/20 shadow-sm">
            Next round incoming
          </div>
        </div>
      )}
    </div>
  );
};
