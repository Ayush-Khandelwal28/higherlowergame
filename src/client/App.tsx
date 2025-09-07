import React from 'react';
import { GameScreen, SubredditInfo } from './components/GameScreen';

export const App = () => {
  const [result, setResult] = React.useState<{ picked: 'left' | 'right'; correct: boolean } | null>(
    null
  );

  const examples: [string, number][] = [
    ['aww', 36000000],
    ['gaming', 42000000],
    ['science', 35000000],
    ['cats', 2500000],
    ['technology', 14000000],
    ['askreddit', 50000000],
    ['art', 25000000]
  ];
  const pick = () => examples[Math.floor(Math.random() * examples.length)] as [string, number];
  const gen = (): { left: SubredditInfo; right: SubredditInfo } => {
    let a = pick();
    let b = pick();
    while (b === a) b = pick();
    return {
      left: { name: a[0], subscribers: a[1] },
      right: { name: b[0], subscribers: b[1] }
    };
  };
  const [pair, setPair] = React.useState(() => gen());
  const higher: 'left' | 'right' = pair.left.subscribers >= pair.right.subscribers ? 'left' : 'right';

  const handleGuess = (picked: 'left' | 'right', correct: boolean) => {
    setResult({ picked, correct });
    setTimeout(() => {
      setPair(gen());
      setResult(null);
    }, 1500);
  };

  return (
    <GameScreen
      left={pair.left}
      right={pair.right}
      higher={higher}
      onGuess={handleGuess}
      result={result}
    />
  );
};
