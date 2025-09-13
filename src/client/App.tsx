import React from 'react';
import { LandingPage } from './components/LandingPage';
import { MysteryPage } from './pages/MysteryPage';
import { ClassicPage } from './pages/ClassicPage';
import { TimedClassicPage } from './pages/TimedClassicPage';
import { TimedMysteryPage } from './pages/TimedMysteryPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { WhichPostWonPage } from './pages/WhichPostWonPage';
import { WhichPostWonSelectPage } from './pages/WhichPostWonSelectPage';

type Route = 'menu' | 'mystery' | 'classic' | 'timed-mystery' | 'timed-classic' | 'leaderboard' | 'post-won-select' | 'post-won';

export const App: React.FC = () => {
  const [route, setRoute] = React.useState<Route>('menu');
  const [postWonSub, setPostWonSub] = React.useState<string | null>(null);

  if (route === 'mystery') return <MysteryPage onBack={() => setRoute('menu')} />;
  if (route === 'classic') return <ClassicPage onBack={() => setRoute('menu')} />;
  if (route === 'timed-mystery') return <TimedMysteryPage onBack={() => setRoute('menu')} />;
  if (route === 'timed-classic') return <TimedClassicPage onBack={() => setRoute('menu')} />;
  if (route === 'leaderboard') return <LeaderboardPage onBack={() => setRoute('menu')} />;
  if (route === 'post-won-select') return (
    <WhichPostWonSelectPage
      onBack={() => setRoute('menu')}
      onSelect={(s) => { setPostWonSub(s); setRoute('post-won'); }}
    />
  );
  if (route === 'post-won') return <WhichPostWonPage onBack={() => setRoute('post-won-select')} {...(postWonSub ? { initialSubreddit: postWonSub } : {})} />;

  return (
    <LandingPage
      onMystery={() => setRoute('mystery')}
      onClassic={() => setRoute('classic')}
      onTimedMystery={() => setRoute('timed-mystery')}
      onTimedClassic={() => setRoute('timed-classic')}
      onLeaderboard={() => setRoute('leaderboard')}
      onPostWon={() => setRoute('post-won-select')}
    />
  );
};
