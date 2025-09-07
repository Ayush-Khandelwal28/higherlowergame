import React from 'react';
import { MysteryGame } from '../components/MysteryGame';

interface MysteryPageProps {
  onBack: () => void;
}
export const MysteryPage: React.FC<MysteryPageProps> = ({ onBack }) => <MysteryGame onExit={onBack} />;
