import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { LeaderboardMode } from '../../shared/types/api';

interface LeaderboardProps { mode: LeaderboardMode; onModeChange: (m: LeaderboardMode) => void; onBack?: () => void; }

const MODE_LABEL: Record<LeaderboardMode, string> = {
  classic: 'Classic',
  mystery: 'Mystery',
  'timed-classic': 'Classic Rush',
  'timed-mystery': 'Mystery Rush',
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ mode, onModeChange, onBack }) => {
  const board = useLeaderboard({ mode, limit: 25, pollMs: 15_000 });
  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center gap-6 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] via-[#ff8717] to-[#ff4500]">Leaderboards</h1>
        <p className="text-xs text-[#ff4500]/70 tracking-wide">Top streaks & rush scores</p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {(Object.keys(MODE_LABEL) as LeaderboardMode[]).map(m => (
            <button key={m} onClick={() => onModeChange(m)} className={[
              'px-3 py-1 rounded-full text-xs font-semibold border shadow-sm transition-all',
              m === mode ? 'bg-gradient-to-r from-[#ff4500] to-[#ff8717] text-white border-[#ff4500]/40' : 'bg-white/80 text-[#ff4500] border-[#ff4500]/30 hover:bg-white'
            ].join(' ')}>{MODE_LABEL[m]}</button>
          ))}
          {onBack && <button onClick={onBack} className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/70 hover:bg-white transition-colors border border-[#ff4500]/30 text-[#ff4500] shadow-sm">Menu</button>}
        </div>
      </div>
      <div className="w-full max-w-xl bg-white/80 backdrop-blur rounded-2xl border border-[#ff4500]/30 shadow-lg overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold tracking-wider text-[#ff4500] bg-white/60 flex items-center justify-between">
          <span>{MODE_LABEL[mode]} Top 25</span>
          {board.fetchedAt && <span className="text-[10px] text-[#ff4500]/60">{new Date(board.fetchedAt).toLocaleTimeString()}</span>}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#ff4500]/70 text-[11px] uppercase tracking-wider">
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {board.loading && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-[#ff4500]/60">Loading...</td></tr>
            )}
            {!board.loading && board.entries.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-[#ff4500]/60">No scores yet</td></tr>
            )}
            {board.entries.map(e => {
              const highlight = board.user && board.user.username === e.username;
              return (
                <tr key={e.username} className={[
                  'border-t border-[#ff4500]/10',
                  highlight ? 'bg-gradient-to-r from-[#ff4500]/15 to-[#ff8717]/15' : 'hover:bg-[#ff4500]/5'
                ].join(' ')}>
                  <td className="px-4 py-2 font-mono text-xs text-[#ff4500]/80">{e.rank}</td>
                  <td className="px-4 py-2 font-semibold text-[#333] truncate max-w-[160px]">{e.username}</td>
                  <td className="px-4 py-2 font-bold text-[#ff4500] text-right">{e.score}</td>
                </tr>
              );
            })}
            {board.user && board.entries.every(e => e.username !== board.user!.username) && (
              <tr className="border-t border-[#ff4500]/10 bg-gradient-to-r from-[#ff4500]/10 to-transparent">
                <td className="px-4 py-2 font-mono text-xs text-[#ff4500]/80">{board.user.rank}</td>
                <td className="px-4 py-2 font-semibold text-[#333] truncate max-w-[160px]">{board.user.username}</td>
                <td className="px-4 py-2 font-bold text-[#ff4500] text-right">{board.user.score}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {board.error && <div className="text-xs text-red-600">{board.error}</div>}
      <button onClick={() => board.refresh()} className="text-[11px] px-3 py-1 rounded-full bg-white/80 border border-[#ff4500]/30 text-[#ff4500] shadow-sm hover:bg-white">Refresh</button>
    </div>
  );
};