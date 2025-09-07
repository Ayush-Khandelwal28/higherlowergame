import React from 'react';
import { BeatTheClock } from '../components/BeatTheClock';

interface TimedClassicPageProps { onBack: () => void; }

export const TimedClassicPage: React.FC<TimedClassicPageProps> = ({ onBack }) => (
  <BeatTheClock variant="classic" onExit={onBack} />
);
