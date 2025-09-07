import React from 'react';
import { LandingPage } from './components/LandingPage';
import subredditsData from '../../data/subreddits.json';
import { MysteryPage } from './pages/MysteryPage';
import { ClassicPage } from './pages/ClassicPage';
import { TimedClassicPage } from './pages/TimedClassicPage';
import { TimedMysteryPage } from './pages/TimedMysteryPage';

type Route = 'menu' | 'mystery' | 'classic' | 'timed-mystery' | 'timed-classic';

export const App: React.FC = () => {
  const [route, setRoute] = React.useState<Route>('menu');

  if (route === 'mystery') return <MysteryPage onBack={() => setRoute('menu')} />;
  if (route === 'classic') return <ClassicPage onBack={() => setRoute('menu')} />;
  if (route === 'timed-mystery') return <TimedMysteryPage onBack={() => setRoute('menu')} />;
  if (route === 'timed-classic') return <TimedClassicPage onBack={() => setRoute('menu')} />;

  return (
    <LandingPage
      onMystery={() => setRoute('mystery')}
      onClassic={() => setRoute('classic')}
      onTimedMystery={() => setRoute('timed-mystery')}
      onTimedClassic={() => setRoute('timed-classic')}
      totalSubreddits={(subredditsData as any).total}
    />
  );
};
