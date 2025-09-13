import React from 'react';
import { PostCard } from '../components/PostCard';
import { useWhichPostWon } from '../hooks/useWhichPostWon';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface PageProps {
  onBack?: () => void;
  initialSubreddit?: string;
}

export const WhichPostWonPage: React.FC<PageProps> = ({ onBack, initialSubreddit }) => {
  const subreddit = initialSubreddit ?? null;
  const game = useWhichPostWon();

  React.useEffect(() => {
    if (subreddit) game.start(subreddit);
  }, [subreddit]);

  // Badge feedback state for VS / ✓ / ✕
  const [badgeState, setBadgeState] = React.useState<'vs' | 'correct' | 'wrong'>('vs');
  const [swapAnim, setSwapAnim] = React.useState(false);
  React.useEffect(() => {
    let revertTimer: number | undefined;
    if (game.guessed && game.guessResult) {
      setSwapAnim(false);
      setBadgeState(game.guessResult.correct ? 'correct' : 'wrong');
      revertTimer = window.setTimeout(() => { setSwapAnim(true); setBadgeState('vs'); }, 900);
    } else if (!game.guessed) {
      setSwapAnim(false);
      setBadgeState('vs');
    }
    return () => { if (revertTimer) window.clearTimeout(revertTimer); };
  }, [game.guessed, game.guessResult]);

  // Leaderboard submission for post-won
  const lb = useLeaderboard({ mode: 'post-won', limit: 0 });
  React.useEffect(() => { if (game.gameOver && game.score > 0) lb.submit(game.score); }, [game.gameOver]);

  const disabled = game.loading || game.guessed || game.gameOver || !game.base || !game.challenger;

  if (!subreddit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-6 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
        <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 w-[min(90%,420px)] shadow-xl border border-[#ff4500]/30">
          <h2 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] to-[#ff8717]">Pick a subreddit first</h2>
          {onBack && <button onClick={onBack} className="px-5 py-2 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white font-semibold shadow hover:shadow-md transition-all">Choose Subreddit</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 gap-8 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
      {/* Header / Score Bar */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] via-[#ff8717] to-[#ff4500] drop-shadow-sm">
            Which Post Won · r/{subreddit}
          </span>
          <span className="block mt-1 text-xs font-medium text-[#ff4500]/70 tracking-wider">
            Is the right post Higher or Lower than the left?
          </span>
        </h1>
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-xs text-[#ff4500]">Score: {game.score}</div>
          <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-xs text-[#ff4500]">Best: {game.best}</div>
          {onBack && (
            <button onClick={onBack} className="px-3 py-2 rounded-lg bg-white/70 hover:bg-white/90 transition-colors border border-[#ff4500]/30 text-[10px] font-semibold text-[#ff4500] shadow-sm">Change Subreddit</button>
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

        <div className="w-full flex flex-col sm:flex-row gap-6 max-w-5xl relative z-20">
          <PostCard
            post={game.base ?? { id: 'n/a', title: 'Loading…', author: null, permalink: '#', score: 0, createdUtc: 0 }}
            selected={false}
            dim={false}
            revealed
            disabled
          />
          <PostCard
            post={game.challenger ?? { id: 'n/a', title: 'Loading…', author: null, permalink: '#', score: 0, createdUtc: 0 }}
            selected={false}
            dim={false}
            revealed={game.guessed}
            disabled
          />
        </div>

        {/* Mobile badge */}
        <div className="sm:hidden flex items-center justify-center z-30 pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
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

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {!game.gameOver && (
          <div className="flex gap-4">
            <button
              disabled={disabled}
              onClick={() => game.guess('higher')}
              className="px-6 py-3 rounded-full font-bold text-sm tracking-wide bg-white/90 hover:bg-white transition-colors border border-[#ff4500]/30 text-[#ff4500] shadow disabled:opacity-50"
            >Higher</button>
            <button
              disabled={disabled}
              onClick={() => game.guess('lower')}
              className="px-6 py-3 rounded-full font-bold text-sm tracking-wide bg-white/90 hover:bg-white transition-colors border border-[#ff4500]/30 text-[#ff4500] shadow disabled:opacity-50"
            >Lower</button>
          </div>
        )}
        <div className="h-6" />
      </div>

      {/* Loading / Error states */}
      {game.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] z-40">
          <div className="flex flex-col items-center gap-3 bg-white/80 px-5 py-4 rounded-2xl border border-[#ff4500]/20 shadow">
            <img src={new URL('../../assets/loading.gif', import.meta.url).toString()} alt="loading" className="w-10 h-10" />
            <div className="text-xs text-[#7c7c7c]">Loading posts…</div>
          </div>
        </div>
      )}
      {game.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 w-[min(90%,420px)] shadow-xl border border-[#ff4500]/30 animate-pop-in">
            <h2 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] to-[#ff8717]">No Posts Available</h2>
            <p className="text-sm text-[#444] text-center">{game.error}</p>
            {onBack && <button onClick={onBack} className="px-5 py-2 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white font-semibold shadow hover:shadow-md transition-all">Pick another subreddit</button>}
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {game.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 w-[min(90%,360px)] shadow-xl border border-[#ff4500]/30 animate-pop-in">
            <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] to-[#ff8717]">Game Over</h2>
            <p className="text-sm text-[#444]">Final Score: <span className="font-bold text-[#ff4500]">{game.score}</span></p>
            <button onClick={game.reset} className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white font-semibold shadow hover:shadow-md transition-all">Play Again</button>
            {onBack && (
              <button onClick={onBack} className="text-xs text-[#ff4500] underline mt-1">Back to Select</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
