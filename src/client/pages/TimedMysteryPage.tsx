import React from 'react';
import { BeatTheClock } from '../components/BeatTheClock';

interface TimedMysteryPageProps { onBack: () => void; }

export const TimedMysteryPage: React.FC<TimedMysteryPageProps> = ({ onBack }) => (
  <BeatTheClock variant="mystery" onExit={onBack} />
);
