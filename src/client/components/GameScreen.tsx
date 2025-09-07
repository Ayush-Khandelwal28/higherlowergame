import React from 'react';
import { SubredditCard } from './SubredditCard';

export interface SubredditInfo {
  name: string;
  icon?: string | null;
  subscribers: number;
}

interface GameScreenProps {
  left: SubredditInfo;
  right: SubredditInfo;
  picked: 'left' | 'right' | null;
  revealed: boolean;
  onPick: (side: 'left' | 'right') => void;
  disabled?: boolean; // optional external control
  className?: string; // allow parent layout styling
}

// Presentational: only renders the two subreddit tiles and handles click forwarding.
export const GameScreen: React.FC<GameScreenProps> = ({
  left,
  right,
  picked,
  revealed,
  onPick,
  disabled,
  className = ''
}) => {
  const handle = (side: 'left' | 'right') => {
    if (revealed || disabled) return;
    onPick(side);
  };

  return (
    <div className={[
      'w-full flex flex-col sm:flex-row gap-6 max-w-5xl relative',
      className
    ].filter(Boolean).join(' ')}>
      <SubredditCard
        side="left"
        data={left}
        selected={picked === 'left'}
        dim={revealed && picked === 'right'}
        revealed={revealed}
        onClick={() => handle('left')}
      />
      <SubredditCard
        side="right"
        data={right}
        selected={picked === 'right'}
        dim={revealed && picked === 'left'}
        revealed={revealed}
        onClick={() => handle('right')}
      />
    </div>
  );
};
