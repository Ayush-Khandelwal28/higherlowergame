import React from 'react';

interface LandingPageProps {
  onClassic: () => void;
  totalSubreddits?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onClassic, totalSubreddits }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 py-12 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-white text-[#1a1a1b]">
      <div className="flex flex-col items-center text-center gap-4 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#ff4500] via-[#ff8717] to-[#ff4500] drop-shadow-sm">
          Higher / Lower
        </h1>
        <p className="max-w-md text-sm sm:text-base text-[#5a5a5d] font-medium leading-relaxed">
          Guess which subreddit has <span className="text-[#ff4500] font-semibold">more subscribers</span>. One wrong pick and it's over.
        </p>
      </div>
      <div className="flex flex-col gap-5 w-full max-w-sm">
        <button
          onClick={onClassic}
          className="group relative overflow-hidden rounded-2xl px-8 py-5 font-extrabold text-lg tracking-wide bg-gradient-to-br from-[#ff4500] to-[#ff8717] text-white shadow-lg hover:shadow-xl transition-all"
        >
          <span className="relative z-10">Classic</span>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        {/* Placeholder for future modes */}
        {/* <button className="rounded-2xl px-8 py-5 font-bold text-lg tracking-wide border-2 border-dashed border-[#ff4500]/40 text-[#ff4500]/60 cursor-not-allowed">Coming Soon</button> */}
      </div>
      <footer className="mt-8 text-[10px] uppercase tracking-wider text-[#b55b2e] font-semibold opacity-80">
        Data snapshot • {totalSubreddits ?? '—'} subreddits
      </footer>
    </div>
  );
};
