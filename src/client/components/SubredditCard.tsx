import React from 'react';
import { CountUpNumber } from './atoms/CountUpNumber';
import type { SubredditInfo } from './GameScreen';

interface CardProps {
  side: 'left' | 'right';
  data: SubredditInfo;
  onClick?: () => void;
  selected: boolean;
  dim: boolean;
  revealed: boolean;
}

export const SubredditCard: React.FC<CardProps> = ({ data, onClick, selected, dim, revealed }) => {
  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex-1 rounded-3xl p-[2px] transition-all duration-300',
        'bg-gradient-to-br from-[#ff4500] via-[#ff8717] to-[#ff4500]',
        dim && 'opacity-60',
        selected && 'scale-[1.02] shadow-xl',
        !selected && !dim && !revealed && 'hover:shadow-lg hover:scale-[1.015]',
        revealed && !selected && 'cursor-default'
      ].filter(Boolean).join(' ')}
      disabled={revealed}
    >
      <div className={[
        'h-full w-full rounded-[inherit] bg-white/95 backdrop-blur flex flex-col items-center gap-4 p-5 sm:p-6 border border-white/40 shadow-sm relative overflow-hidden',
        'min-h-[260px] sm:min-h-[300px]'
      ].join(' ')}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(255,69,0,0.15),transparent_60%)]" />
        <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl border-2 border-[#ff4500]/30 bg-gradient-to-br from-white via-[#fff5ef] to-[#ffe3d3] flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[#ff4500]/60 transition-colors">
          {data.icon ? (
            <img src={data.icon} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl" role="img" aria-label="subreddit">🧿</span>
          )}
        </div>
        <div className="text-center">
          <div className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] to-[#ff8717] drop-shadow-sm">r/{data.name}</div>
          <div className="mt-2 h-8 flex items-center justify-center font-mono text-sm text-[#6a6a6d]">
            {!revealed ? (
              <span className="text-[#ff4500]/50 tracking-wide font-semibold">???</span>
            ) : (
              <CountUpNumber value={data.subscribers} />
            )}
          </div>
        </div>
      </div>

      {!revealed && (
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none bg-gradient-to-br from-transparent via-transparent to-[#ff4500]/5" />
      )}
      </div>
  </button>
  );
};
