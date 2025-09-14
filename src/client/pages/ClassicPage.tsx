import React from 'react';
import { ClassicGame } from '../components/ClassicGame';

interface ClassicPageProps { onBack: () => void; onViewLeaderboard?: () => void; }

export const ClassicPage: React.FC<ClassicPageProps> = ({ onBack, onViewLeaderboard }) => (
  <ClassicGame onExit={onBack} onViewLeaderboard={onViewLeaderboard} />
);
