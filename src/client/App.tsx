import React from 'react';
import { LandingPage } from './components/LandingPage';
import subredditsData from '../../data/subreddits.json';
import { MysteryPage } from './pages/MysteryPage';

type Route = 'menu' | 'mystery';

export const App: React.FC = () => {
  const [route, setRoute] = React.useState<Route>('menu');

  if (route === 'mystery') {
    return <MysteryPage onBack={() => setRoute('menu')} />;
  }

  return (
    <LandingPage
  onMystery={() => setRoute('mystery')}
      totalSubreddits={(subredditsData as any).total}
    />
  );
};
