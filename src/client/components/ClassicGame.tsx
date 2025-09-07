import React from 'react';
import subredditsData from '../../../data/subreddits.json';
import { useClassicGame } from '../hooks/useClassicGame';
import { SubredditCard } from './SubredditCard';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface ClassicGameProps { onExit?: () => void; }

export const ClassicGame: React.FC<ClassicGameProps> = ({ onExit }) => {
  const entries = (subredditsData as any).entries;
  const {
    base,
    challenger,
    score,
    best,
    gameOver,
    guessed,
    guessResult,
    guess,
    reset,
  } = useClassicGame(entries);

  // Badge feedback state (local) to revert to VS while hook still processing
  const [badgeState, setBadgeState] = React.useState<'vs' | 'correct' | 'wrong'>('vs');
  const [swapAnim, setSwapAnim] = React.useState(false);
  React.useEffect(() => {
    let timer: number | undefined;
    if (guessed && guessResult) {
      setSwapAnim(false);
      setBadgeState(guessResult.correct ? 'correct' : 'wrong');
      timer = window.setTimeout(() => {
        setSwapAnim(true);
        setBadgeState('vs');
      }, 900);
    } else if (!guessed) {
      setSwapAnim(false);
      setBadgeState('vs');
    }
    return () => { if (timer) window.clearTimeout(timer); };
  }, [guessed, guessResult]);

  const disabled = guessed || gameOver;

  // Leaderboard submission (classic)
  const lb = useLeaderboard({ mode: 'classic', limit: 0 }); // limit 0 to skip fetching list
  React.useEffect(() => {
    if (gameOver && score > 0) {
      lb.submit(score);
    }
  }, [gameOver]);

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 gap-8 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] via-[#ff8717] to-[#ff4500] drop-shadow-sm">
            Classic Higher / Lower
          </span>
          <span className="block mt-1 text-xs font-medium text-[#ff4500]/70 tracking-wider">
            Is the right subreddit Higher or Lower?
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

      <div className="relative w-full flex flex-col items-center">
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
        <div className="w-full flex flex-col sm:flex-row gap-6 max-w-5xl relative z-20">
          <SubredditCard
            side="left"
            data={base}
            selected={false}
            dim={false}
            revealed
            showSubscribers
            disabled
          />
          <SubredditCard
            side="right"
            data={challenger}
            selected={false}
            dim={false}
            revealed={guessed}
            showSubscribers={guessed}
            disabled
          />
        </div>
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

      <div className="flex flex-col items-center gap-4">
        {!gameOver && (
          <div className="flex gap-4">
            <button
              disabled={disabled}
              onClick={() => guess('higher')}
              className="px-6 py-3 rounded-full font-bold text-sm tracking-wide bg-white/90 hover:bg-white transition-colors border border-[#ff4500]/30 text-[#ff4500] shadow disabled:opacity-50"
            >Higher</button>
            <button
              disabled={disabled}
              onClick={() => guess('lower')}
              className="px-6 py-3 rounded-full font-bold text-sm tracking-wide bg-white/90 hover:bg-white transition-colors border border-[#ff4500]/30 text-[#ff4500] shadow disabled:opacity-50"
            >Lower</button>
          </div>
        )}
        {/* Removed separate textual result banner; feedback now in center badge */}
        <div className="h-6" />
      </div>

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 w-[min(90%,360px)] shadow-xl border border-[#ff4500]/30 animate-pop-in">
            <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] to-[#ff8717]">Game Over</h2>
            <p className="text-sm text-[#444]">Final Score: <span className="font-bold text-[#ff4500]">{score}</span></p>
            <button onClick={reset} className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white font-semibold shadow hover:shadow-md transition-all">Play Again</button>
            {onExit && (
              <button onClick={onExit} className="text-xs text-[#ff4500] underline mt-1">Back to Menu</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
