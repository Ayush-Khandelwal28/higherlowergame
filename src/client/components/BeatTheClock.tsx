import React from 'react';
import subredditsData from '../../../data/subreddits.json';
import { useCountdown } from '../hooks/useCountdown';
import { useClassicTimed } from '../hooks/useClassicTimed';
import { useMysteryTimed } from '../hooks/useMysteryTimed';
import { SubredditCard } from './SubredditCard';
import { GameScreen } from './GameScreen';
import type { SubredditEntry } from '../hooks/useMysteryGame';
import { useLeaderboard } from '../hooks/useLeaderboard';

export type TimedVariant = 'classic' | 'mystery';

interface BeatTheClockProps { variant: TimedVariant; onExit?: () => void; onViewLeaderboard?: () => void; }

const DURATION_MS = 60_000;

export const BeatTheClock: React.FC<BeatTheClockProps> = ({ variant, onExit, onViewLeaderboard }) => {
  const entries = (subredditsData as any).entries as SubredditEntry[];
  const timer = useCountdown({ durationMs: DURATION_MS, autoStart: true, intervalMs: 200 });

  const classic = variant === 'classic' ? useClassicTimed(entries, { durationMs: DURATION_MS }) : null;
  const mystery = variant === 'mystery' ? useMysteryTimed(entries) : null;

  const timeUp = timer.remainingMs <= 0;
  const score = classic ? classic.score : mystery!.score;
  const mistakes = classic ? classic.mistakes : mystery!.mistakes;

  const lb = useLeaderboard({ mode: variant === 'classic' ? 'timed-classic' : 'timed-mystery', limit: 0 });
  React.useEffect(() => { if (timeUp && score > 0) lb.submit(score); }, [timeUp]);

  // Ensure submit completes before navigating to leaderboard
  const [submittingLB, setSubmittingLB] = React.useState(false);
  const viewLeaderboard = React.useCallback(async () => {
    if (submittingLB) return;
    setSubmittingLB(true);
    try {
      if (timeUp && score > 0) {
        await lb.submit(score);
      }
    } finally {
      setSubmittingLB(false);
      onViewLeaderboard?.();
    }
  }, [timeUp, score, lb, onViewLeaderboard, submittingLB]);

  // Badge feedback (mirrors existing streak modes)
  const [badgeState, setBadgeState] = React.useState<'vs' | 'correct' | 'wrong'>('vs');
  const [swapAnim, setSwapAnim] = React.useState(false);
  React.useEffect(() => {
    let timerId: number | undefined;
    if (variant === 'classic' && classic) {
      if (!classic.inRound && classic.guessResult) {
        setSwapAnim(false);
        setBadgeState(classic.guessResult.correct ? 'correct' : 'wrong');
        timerId = window.setTimeout(() => { setSwapAnim(true); setBadgeState('vs'); }, 800);
      } else if (classic.inRound) {
        setSwapAnim(false); setBadgeState('vs');
      }
    } else if (variant === 'mystery' && mystery) {
      if (mystery.result && mystery.picked) {
        setSwapAnim(false);
        setBadgeState(mystery.result.correct ? 'correct' : 'wrong');
        timerId = window.setTimeout(() => { setSwapAnim(true); setBadgeState('vs'); }, 800);
      } else if (!mystery.picked) {
        setSwapAnim(false); setBadgeState('vs');
      }
    }
    return () => { if (timerId) window.clearTimeout(timerId); };
  }, [variant, classic?.inRound, classic?.guessResult, mystery?.result, mystery?.picked]);

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 gap-8 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] via-[#ff8717] to-[#ff4500] drop-shadow-sm">
            Beat The Clock · {variant === 'classic' ? 'Classic' : 'Mystery'}
          </span>
          <span className="block mt-1 text-xs font-medium text-[#ff4500]/70 tracking-wider">
            {variant === 'classic' ? 'Higher or Lower (no eliminations)' : 'Pick the higher subreddit'}
          </span>
        </h1>
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-xs text-[#ff4500]">Score: {score}</div>
          <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-[#ff4500]/30 shadow font-semibold text-xs text-[#ff4500]">Mistakes: {mistakes}</div>
          <div className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur border border-[#ff4500]/40 shadow font-bold text-xs text-[#ff4500] flex items-center gap-2">
            <span className="inline-block w-24 h-2 rounded bg-[#ff4500]/20 overflow-hidden">
              <span className="block h-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] transition-all" style={{ width: `${(1 - timer.remainingMs / DURATION_MS) * 100}%` }} />
            </span>
            {timer.remainingSeconds}s
          </div>
          {onExit && (
            <button onClick={onExit} className="px-3 py-2 rounded-lg bg-white/70 hover:bg-white/90 transition-colors border border-[#ff4500]/30 text-[10px] font-semibold text-[#ff4500] shadow-sm">Menu</button>
          )}
        </div>
      </div>

      {/* Game area */}
      {(variant === 'classic' && classic) && (
        <>
        <div className="relative w-full flex flex-col items-center">
          {/* Badge */}
          <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className={[
              'w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl shadow-lg ring-4 ring-white/70 transition-all duration-300',
              badgeState === 'correct' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white animate-result-pop' :
              badgeState === 'wrong' ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white animate-result-pop' :
              'bg-gradient-to-br from-[#ff4500] to-[#ff8717] text-white ' + (swapAnim ? 'animate-badge-swap' : 'animate-pulse-glow')
            ].join(' ')}>
              {badgeState === 'correct' ? '✓' : badgeState === 'wrong' ? '✕' : 'VS'}
            </div>
          </div>
          <div className="w-full flex flex-col sm:flex-row gap-6 max-w-5xl relative z-20">
            <SubredditCard side="left" data={classic.base} selected={false} dim={false} revealed showSubscribers disabled />
            <SubredditCard side="right" data={classic.challenger} selected={false} dim={false} revealed={!classic.inRound} showSubscribers={!classic.inRound} disabled />
          </div>
          {/* Mobile badge */}
          <div className="sm:hidden flex items-center justify-center z-30 pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <div className={[
              'px-6 py-2 rounded-full font-extrabold text-lg shadow transition-all duration-300',
              badgeState === 'correct' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-result-pop' :
              badgeState === 'wrong' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white animate-result-pop' :
              'bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white ' + (swapAnim ? 'animate-badge-swap' : 'animate-pulse-glow')
            ].join(' ')}>
              {badgeState === 'correct' ? '✓' : badgeState === 'wrong' ? '✕' : 'VS'}
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button disabled={!classic.inRound || timeUp} onClick={() => classic.guess('higher')} className="px-6 py-3 rounded-full font-bold text-sm tracking-wide bg-white/90 hover:bg-white transition-colors border border-[#ff4500]/30 text-[#ff4500] shadow disabled:opacity-50">Higher</button>
          <button disabled={!classic.inRound || timeUp} onClick={() => classic.guess('lower')} className="px-6 py-3 rounded-full font-bold text-sm tracking-wide bg-white/90 hover:bg-white transition-colors border border-[#ff4500]/30 text-[#ff4500] shadow disabled:opacity-50">Lower</button>
        </div>
        </>
      )}

      {(variant === 'mystery' && mystery) && (
        <div className="relative w-full flex flex-col items-center">
          <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className={[
              'w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl shadow-lg ring-4 ring-white/70 transition-all duration-300',
              badgeState === 'correct' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white animate-result-pop' :
              badgeState === 'wrong' ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white animate-result-pop' :
              'bg-gradient-to-br from-[#ff4500] to-[#ff8717] text-white ' + (swapAnim ? 'animate-badge-swap' : 'animate-pulse-glow')
            ].join(' ')}>
              {badgeState === 'correct' ? '✓' : badgeState === 'wrong' ? '✕' : 'VS'}
            </div>
          </div>
          <GameScreen
            key={mystery.round}
            left={mystery.left}
            right={mystery.right}
            picked={mystery.picked}
            revealed={mystery.revealed}
            onPick={mystery.pick}
          />
          <div className="sm:hidden flex items-center justify-center z-30 pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <div className={[
              'px-6 py-2 rounded-full font-extrabold text-lg shadow transition-all duration-300',
              badgeState === 'correct' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-result-pop' :
              badgeState === 'wrong' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white animate-result-pop' :
              'bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white ' + (swapAnim ? 'animate-badge-swap' : 'animate-pulse-glow')
            ].join(' ')}>
              {badgeState === 'correct' ? '✓' : badgeState === 'wrong' ? '✕' : 'VS'}
            </div>
          </div>
        </div>
      )}

      {timeUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 w-[min(90%,360px)] shadow-xl border border-[#ff4500]/30 animate-pop-in">
            <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] to-[#ff8717]">Time Up</h2>
            <p className="text-sm text-[#444]">Final Score: <span className="font-bold text-[#ff4500]">{score}</span></p>
            <button onClick={() => { variant === 'classic' ? classic?.reset() : mystery?.reset(); timer.reset(); }} className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white font-semibold shadow hover:shadow-md transition-all">Play Again</button>
            <button onClick={viewLeaderboard} disabled={submittingLB} className="mt-1 px-5 py-2 rounded-full bg-white text-[#ff4500] font-semibold border border-[#ff4500]/40 shadow hover:bg-white/80 transition-all disabled:opacity-60">
              {submittingLB ? 'Updating…' : 'View Leaderboard'}
            </button>
            {onExit && <button onClick={onExit} className="text-xs text-[#ff4500] underline">Back to Menu</button>}
          </div>
        </div>
      )}
    </div>
  );
};
