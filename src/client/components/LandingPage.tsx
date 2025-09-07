import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onMystery: () => void;
  onClassic: () => void;
  onTimedMystery: () => void;
  onTimedClassic: () => void;
  totalSubreddits?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onMystery,
  onClassic,
  onTimedMystery,
  onTimedClassic,
  totalSubreddits,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
              <span className="text-orange-200 animate-pulse">
                Guess which subreddit has MORE subscribers!
              </span>
            </p>
          </div>
        </div>

        {/* Enhanced Game Modes */}
        <div className="grid gap-8 lg:grid-cols-2 w-full max-w-5xl">
          {/* Streak Mode Card */}
          <div 
            className={`group relative rounded-3xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 hover:rotate-1 ${hoveredCard === 'streak' ? 'shadow-orange-500/50 shadow-3xl' : ''}`}
            onMouseEnter={() => setHoveredCard('streak')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl animate-spin-slow">🎯</div>
                <h2 className="text-2xl font-black text-gray-800">
                  STREAK MODE
                </h2>
              </div>
              
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                One wrong pick = <span className="text-red-500 font-bold">GAME OVER</span>
                <br />
                How legendary can your streak become? 🏆
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={onMystery}
                  className="group/btn relative w-full overflow-hidden rounded-2xl px-8 py-5 font-black text-xl tracking-wide shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white transform hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    🔮 MYSTERY MODE
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 opacity-75 blur group-hover/btn:opacity-100 transition-opacity" />
                </button>
                
                <button
                  onClick={onClassic}
                  className="group/btn relative w-full overflow-hidden rounded-2xl px-8 py-5 font-black text-xl tracking-wide shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white transform hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    📊 CLASSIC MODE
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur group-hover/btn:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>

          {/* Timed Mode Card */}
          <div 
            className={`group relative rounded-3xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 hover:-rotate-1 ${hoveredCard === 'timed' ? 'shadow-orange-500/50 shadow-3xl' : ''}`}
            onMouseEnter={() => setHoveredCard('timed')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl animate-pulse">⏱️</div>
                <h2 className="text-2xl font-black text-gray-800">
                  BEAT THE CLOCK
                </h2>
              </div>
              
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                <span className="text-red-500 font-bold text-2xl">60 SECONDS</span> of pure adrenaline!
                <br />
                Score as many as you can! ⚡
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={onTimedMystery}
                  className="group/btn relative w-full overflow-hidden rounded-2xl px-8 py-5 font-black text-xl tracking-wide shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white transform hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    🔮 MYSTERY RUSH
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-red-600 opacity-75 blur group-hover/btn:opacity-100 transition-opacity" />
                </button>
                
                <button
                  onClick={onTimedClassic}
                  className="group/btn relative w-full overflow-hidden rounded-2xl px-8 py-5 font-black text-xl tracking-wide shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 text-white transform hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    📊 CLASSIC RUSH
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 opacity-75 blur group-hover/btn:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="mt-16 relative">
          <div className="flex items-center gap-4 px-8 py-4 rounded-full bg-black/20 backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-bold tracking-wider text-lg">
              LIVE DATA • {totalSubreddits?.toLocaleString() ?? '—'} SUBREDDITS
            </span>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </footer>
      </div>
    </div>
  );
};