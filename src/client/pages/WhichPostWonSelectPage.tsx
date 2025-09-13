import React from 'react';
import pictureData from '../../../data/picture_posts.json';

interface PageProps { onBack?: () => void; onSelect: (subreddit: string) => void; }

type Entry = { subreddit?: string | null } & Record<string, unknown>;

const availableSubs = (() => {
  try {
    const entries = Array.isArray((pictureData as any)?.entries) ? (pictureData as any).entries as Entry[] : [];
    const counts = new Map<string, number>();
    for (const e of entries) {
      const s = (e.subreddit || '').toString().trim();
      const thumbField = (e as any).imageUrl ?? (e as any).thumbnail ?? '';
      const thumb = typeof thumbField === 'string' ? thumbField : '';
      const hasImage = /^https?:\/\//i.test(thumb);
      if (!s || !hasImage) continue;
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    const list = Array.from(counts.entries())
      .filter(([, c]) => c >= 2) // need at least 2 image posts to play
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return list;
  } catch {
    return [] as string[];
  }
})();

export const WhichPostWonSelectPage: React.FC<PageProps> = ({ onBack, onSelect }) => {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableSubs;
    return availableSubs.filter(s => s.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 gap-6 bg-gradient-to-br from-[#ffe5d6] via-[#fff7f3] to-[#ffffff] text-[#1a1a1b]">
      <div className="flex items-center gap-3 w-full max-w-3xl">
        {onBack && (
          <button onClick={onBack} className="px-3 py-2 rounded-lg bg-white/70 hover:bg-white/90 transition-colors border border-[#ff4500]/30 text-[10px] font-semibold text-[#ff4500] shadow-sm">Menu</button>
        )}
        <h1 className="text-xl font-extrabold">Choose a subreddit</h1>
      </div>

      <div className="w-full max-w-3xl bg-white/70 backdrop-blur rounded-2xl p-4 border border-[#ff4500]/20 shadow">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search subreddit"
          className="w-full px-3 py-2 rounded-lg border border-[#ff4500]/30 bg-white/80"
        />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-auto">
          {filtered.map(name => (
            <button
              key={name}
              onClick={() => onSelect(name)}
              className="px-3 py-2 rounded-lg bg-white border border-[#ff4500]/20 hover:border-[#ff4500]/40 text-xs text-[#ff4500] font-semibold text-left truncate"
              title={name}
            >
              {name}
            </button>
          ))}
          {!filtered.length && (
            <div className="text-sm text-[#7c7c7c] col-span-full">No subreddits found.</div>
          )}
        </div>
      </div>
    </div>
  );
};


