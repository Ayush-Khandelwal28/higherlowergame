import React from 'react';
import { BeatTheClock } from '../components/BeatTheClock';

interface TimedClassicPageProps { onBack: () => void; onViewLeaderboard?: () => void; }

export const TimedClassicPage: React.FC<TimedClassicPageProps> = ({ onBack, onViewLeaderboard }) => (
  <BeatTheClock variant="classic" onExit={onBack} onViewLeaderboard={onViewLeaderboard} />
);
