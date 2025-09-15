import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onMystery: () => void;
  onClassic: () => void;
  onTimedMystery: () => void;
  onTimedClassic: () => void;
  onLeaderboard: () => void;
  onPostWon?: () => void;
  totalSubreddits?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onMystery,
  onClassic,
  onTimedMystery,
  onTimedClassic,
  onLeaderboard,
  onPostWon,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [modePicker, setModePicker] = useState<null | 'classic' | 'mystery'>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const floatingElements = Array.from({ length: 8 }, (_, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-20 animate-pulse`}
      style={{
        left: `${15 + (i * 12)}%`,
        top: `${20 + (i * 8)}%`,
        animationDelay: `${i * 0.5}s`,
        animationDuration: `${2 + (i * 0.3)}s`,
      }}
    />
  ));

  return (
    <div
      className="min-h-screen relative overflow-hidden animate-gradient-shift"
      style={{
        background: `
          radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 69, 0, 0.15) 0%, transparent 50%),
          linear-gradient(135deg, #ff4500 0%, #ff8717 25%, #ffffff 50%, #ff8717 75%, #ff4500 100%)
        `,
        backgroundSize: '400% 400%'
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Enhanced Title Section */}
        <div className="flex flex-col items-center text-center gap-6 mb-12">
          <div className="relative">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>H</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>i</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>g</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>h</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>e</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>r</span>
              <span className="mx-4 text-orange-300">/</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>L</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>o</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>w</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>e</span>
              <span className="inline-block animate-bounce" style={{ animationDelay: '1s' }}>r</span>
            </h1>
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-600 to-orange-400 opacity-20 blur-xl rounded-full" />
          </div>

          <div className="relative p-6 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl">
            <p className="max-w-lg text-lg sm:text-xl text-white font-bold leading-relaxed">
              🚀 Think you know Reddit?
              <br />
              <span className="text-orange-500 animate-pulse">
                Guess which subreddit has MORE subscribers!
              </span>
            </p>
          </div>
        </div>

        {/* Simplified Game Modes */}
        <div className="grid gap-8 lg:grid-cols-3 w-full max-w-6xl">
          {/* Classic Card */}
          <div
            className={`group relative rounded-3xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 ${hoveredCard === 'classic' ? 'shadow-orange-500/50 shadow-3xl' : ''}`}
            onMouseEnter={() => setHoveredCard('classic')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setModePicker('classic')}
            role="button"
            aria-label="Choose Classic Mode"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">📊</div>
                <h2 className="text-2xl font-black text-gray-800">CLASSIC</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Pick which subreddit has more subscribers. Easy to learn, hard to master!
              </p>
            </div>
          </div>

          {/* Mystery Card */}
          <div
            className={`group relative rounded-3xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 ${hoveredCard === 'mystery' ? 'shadow-orange-500/50 shadow-3xl' : ''}`}
            onMouseEnter={() => setHoveredCard('mystery')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setModePicker('mystery')}
            role="button"
            aria-label="Choose Mystery Mode"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/15 to-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🔮</div>
                <h2 className="text-2xl font-black text-gray-800">MYSTERY</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Hidden subscriber counts. Trust your intuition and vibes.
              </p>
            </div>
          </div>

          {/* Versus Card */}
          <div
            className={`group relative rounded-3xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 ${hoveredCard === 'postwon' ? 'shadow-orange-500/50 shadow-3xl' : ''}`}
            onMouseEnter={() => setHoveredCard('postwon')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={onPostWon}
            role="button"
            aria-label="Play Versus"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onPostWon) {
                e.preventDefault();
                onPostWon();
              }
            }}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🆚</div>
                <h2 className="text-2xl font-black text-gray-800">VERSUS</h2>
              </div>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Two posts enter. Only one has more upvotes. Pick the winner!
              </p>

            </div>
          </div>
        </div>

        {/* Sub-mode Picker Overlay */}
        {modePicker && (
          <div className="fixed inset-0 z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModePicker(null)} />
            <div className="relative z-30 w-[90%] max-w-md rounded-3xl p-6 sm:p-8 bg-white/90 shadow-2xl border border-white/60 animate-pop">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">
                  {modePicker === 'classic' ? 'Classic' : 'Mystery'} · Choose a mode
                </h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setModePicker(null)}>✖</button>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setModePicker(null);
                    modePicker === 'classic' ? onClassic() : onMystery();
                  }}
                  className="w-full rounded-2xl px-6 py-5 font-extrabold text-lg text-white shadow-lg bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 hover:scale-[1.02] transition-transform"
                >
                  🎯 Streak Based
                  <div className="text-sm font-semibold opacity-90 mt-1">Keep going until you're wrong</div>
                </button>
                <button
                  onClick={() => {
                    setModePicker(null);
                    modePicker === 'classic' ? onTimedClassic() : onTimedMystery();
                  }}
                  className="w-full rounded-2xl px-6 py-5 font-extrabold text-lg text-white shadow-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:scale-[1.02] transition-transform"
                >
                  ⏱️ Time Based
                  <div className="text-sm font-semibold opacity-90 mt-1">Race against the clock</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Footer */}
        <footer className="mt-16 relative">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-4xl mx-auto">
            {/* Main Leaderboard Button */}
            <button
              onClick={onLeaderboard}
              className="group relative overflow-hidden rounded-2xl px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-white font-black text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                🏆 VIEW LEADERBOARDS
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};