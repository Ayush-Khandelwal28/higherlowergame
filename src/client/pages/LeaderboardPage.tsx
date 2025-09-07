import React from 'react';
import { Leaderboard } from '../components/Leaderboard';
import type { LeaderboardMode } from '../../shared/types/api';

interface LeaderboardPageProps { onBack: () => void; }

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack }) => {
  const [mode, setMode] = React.useState<LeaderboardMode>('classic');
  return <Leaderboard mode={mode} onModeChange={setMode} onBack={onBack} />;
};