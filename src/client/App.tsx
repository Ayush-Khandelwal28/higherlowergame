import React from 'react';
import { LandingPage } from './components/LandingPage';
import subredditsData from '../../data/subreddits.json';
import { ClassicPage } from './pages/ClassicPage';

type Route = 'menu' | 'classic';

export const App: React.FC = () => {
  const [route, setRoute] = React.useState<Route>('menu');

  if (route === 'classic') {
    return <ClassicPage onBack={() => setRoute('menu')} />;
  }

  return (
    <LandingPage
      onClassic={() => setRoute('classic')}
      totalSubreddits={(subredditsData as any).total}
    />
  );
};
