import React from 'react';
import { GameScreen } from './GameScreen';
import subredditsData from '../../../data/subreddits.json';
import { useMysteryGame, SubredditEntry } from '../hooks/useMysteryGame';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface MysteryGameProps {
  onExit?: () => void; // optional back handler
}

export const MysteryGame: React.FC<MysteryGameProps> = ({ onExit }) => {
  const entries = (subredditsData as any).entries as SubredditEntry[];
  const {
    left,
    right,
    picked,
    revealed,
    score,
    best,
    gameOver,
    result,
    round,
    handlePick,
    resetGame,
  } = useMysteryGame(entries);

  // Local badge feedback state to allow reverting to VS before round transition
  const [badgeState, setBadgeState] = React.useState<'vs' | 'correct' | 'wrong'>('vs');
  const [swapAnim, setSwapAnim] = React.useState(false);
  React.useEffect(() => {
    let revertTimer: number | undefined;
    if (result && picked) {
      setSwapAnim(false); // reset swap flag
      setBadgeState(result.correct ? 'correct' : 'wrong');
      revertTimer = window.setTimeout(() => {
        setSwapAnim(true);
        setBadgeState('vs');
      }, 900); // show feedback briefly then revert
    } else if (!picked) {
      // ensure default when new round starts
      setSwapAnim(false);
      setBadgeState('vs');
    }
    return () => { if (revertTimer) window.clearTimeout(revertTimer); };
  }, [result, picked]);

  // Leaderboard submission
  const lb = useLeaderboard({ mode: 'mystery', limit: 0 });
  React.useEffect(() => { if (gameOver && score > 0) lb.submit(score); }, [gameOver]);

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

      {/* Tiles + VS / Result badge overlay */}
      <div className="relative w-full flex flex-col items-center">
        {/* Desktop center badge */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div
            className={[
              'w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl shadow-lg ring-4 ring-white/70 transition-all duration-300',
              badgeState === 'correct' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white animate-result-pop' :
              badgeState === 'wrong' ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white animate-result-pop' :
              'bg-gradient-to-br from-[#ff4500] to-[#ff8717] text-white ' + (swapAnim ? 'animate-badge-swap' : 'animate-pulse-glow')
            ].join(' ')}
            aria-live="polite"
            aria-label={badgeState === 'correct' ? 'Correct' : badgeState === 'wrong' ? 'Incorrect' : 'Versus'}
          >
            {badgeState === 'correct' ? '✓' : badgeState === 'wrong' ? '✕' : 'VS'}
          </div>
        </div>
        <GameScreen
          key={round}
          left={left}
          right={right}
          picked={picked}
          revealed={revealed}
          onPick={handlePick}
          className="z-20"
        />
        {/* Mobile badge */}
        <div className="sm:hidden flex items-center justify-center -mt-2 z-30 pointer-events-none">
          <div
            className={[
              'px-6 py-2 rounded-full font-extrabold text-lg shadow transition-all duration-300',
              badgeState === 'correct' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-result-pop' :
              badgeState === 'wrong' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white animate-result-pop' :
              'bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white ' + (swapAnim ? 'animate-badge-swap' : 'animate-pulse-glow')
            ].join(' ')}
            aria-live="polite"
            aria-label={badgeState === 'correct' ? 'Correct' : badgeState === 'wrong' ? 'Incorrect' : 'Versus'}
          >
            {badgeState === 'correct' ? '✓' : badgeState === 'wrong' ? '✕' : 'VS'}
          </div>
        </div>
      </div>

      {/* Spacer to keep layout balanced (replaces old banner area) */}
      <div className="h-14" />

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
