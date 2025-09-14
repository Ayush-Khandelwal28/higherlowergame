import React from 'react';
import { MysteryGame } from '../components/MysteryGame';

interface MysteryPageProps {
  onBack: () => void;
  onViewLeaderboard?: () => void;
}
export const MysteryPage: React.FC<MysteryPageProps> = ({ onBack, onViewLeaderboard }) => <MysteryGame onExit={onBack} onViewLeaderboard={onViewLeaderboard} />;
