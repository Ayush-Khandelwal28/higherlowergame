import React from 'react';
import { LandingPage } from './components/LandingPage';
import subredditsData from '../../data/subreddits.json';
import { MysteryPage } from './pages/MysteryPage';
import { ClassicPage } from './pages/ClassicPage';

type Route = 'menu' | 'mystery' | 'classic';

export const App: React.FC = () => {
  const [route, setRoute] = React.useState<Route>('menu');

  if (route === 'mystery') return <MysteryPage onBack={() => setRoute('menu')} />;
  if (route === 'classic') return <ClassicPage onBack={() => setRoute('menu')} />;

  return (
    <LandingPage
      onMystery={() => setRoute('mystery')}
      onClassic={() => setRoute('classic')}
      totalSubreddits={(subredditsData as any).total}
    />
  );
};
