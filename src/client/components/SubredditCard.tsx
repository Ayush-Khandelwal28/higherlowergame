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
  showSubscribers?: boolean; // optional explicit control to show subscriber count regardless of revealed state
  disabled?: boolean;
}

export const SubredditCard: React.FC<CardProps> = ({ data, onClick, selected, dim, revealed, showSubscribers, disabled }) => {
  const displaySubscribers = showSubscribers ?? revealed;
  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex-1 rounded-3xl p-[2px] transition-all duration-300 overflow-hidden',
        'bg-gradient-to-br from-[#ff4500] via-[#ff8717] to-[#ff4500]',
        dim && 'opacity-60',
        selected && 'scale-[1.02] shadow-xl',
        !selected && !dim && !revealed && 'hover:shadow-lg hover:scale-[1.015]',
        revealed && !selected && 'cursor-default'
      ].filter(Boolean).join(' ')}
      disabled={revealed || disabled}
    >
      <div className={[
        'h-full w-full rounded-[inherit] relative flex flex-col items-center justify-end gap-4 px-5 sm:px-6 pt-8 pb-6',
        'min-h-[260px] sm:min-h-[300px]'
      ].join(' ')}>
        {/* Background media */}
    <div className="absolute inset-0 z-0 rounded-[inherit] overflow-hidden">
          {data.icon ? (
            <img
              src={data.icon}
              alt={data.name}
        className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white via-[#fff5ef] to-[#ffe3d3] text-6xl">
              <span role="img" aria-label="subreddit">🧿</span>
            </div>
          )}
      {/* Softer overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/40" />
      {/* Subtle accent glow only on hover without hiding logo */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_30%,rgba(255,135,23,0.25),transparent_65%)]" />
        </div>

        {/* Content */}
        <div className="w-full flex flex-col items-center text-center">
          <div className="font-extrabold text-lg sm:text-xl tracking-tight text-white drop-shadow-sm">
            r/{data.name}
          </div>
          <div className="mt-3 h-8 flex items-center justify-center font-mono text-sm">
            {!displaySubscribers ? (
              <span className="text-white/70 tracking-wide font-semibold">???</span>
            ) : (
              <CountUpNumber value={data.subscribers} className="text-white font-semibold text-base sm:text-lg drop-shadow" />
            )}
          </div>
        </div>

        {/* Edge highlight when revealed */}
        {revealed && (
          <div className="absolute inset-0 rounded-[inherit] ring-2 ring-white/20 pointer-events-none" />
        )}
        {/* Subtle top sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay" />
      </div>
    </button>
  );
};
