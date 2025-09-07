import React from 'react';
import { ClassicGame } from '../components/ClassicGame';

interface ClassicPageProps { onBack: () => void; }

export const ClassicPage: React.FC<ClassicPageProps> = ({ onBack }) => <ClassicGame onExit={onBack} />;
