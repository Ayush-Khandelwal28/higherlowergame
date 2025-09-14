import React from 'react';
import { BeatTheClock } from '../components/BeatTheClock';

interface TimedMysteryPageProps { onBack: () => void; onViewLeaderboard?: () => void; }

export const TimedMysteryPage: React.FC<TimedMysteryPageProps> = ({ onBack, onViewLeaderboard }) => (
  <BeatTheClock variant="mystery" onExit={onBack} onViewLeaderboard={onViewLeaderboard} />
);
