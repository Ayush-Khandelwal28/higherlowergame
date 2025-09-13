import React from 'react';
import { Leaderboard } from '../components/Leaderboard';
import type { LeaderboardMode } from '../../shared/types/api';

interface LeaderboardPageProps { onBack: () => void; initialMode?: LeaderboardMode }

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack, initialMode }) => {
  const [mode, setMode] = React.useState<LeaderboardMode>(initialMode ?? 'classic');
  React.useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);
  return <Leaderboard mode={mode} onModeChange={setMode} onBack={onBack} />;
};