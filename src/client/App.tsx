import { navigateTo } from '@devvit/web/client';
import { useCounter } from './hooks/useCounter';
import React from 'react';

export const App = () => {
  const { count, username, loading, increment, decrement } = useCounter();
  const [subredditName, setSubredditName] = React.useState('askreddit');
  const [subredditLoading, setSubredditLoading] = React.useState(false);
  const [subredditData, setSubredditData] = React.useState<unknown>(null);
  const [subredditError, setSubredditError] = React.useState<string | null>(null);

  const fetchSubreddit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!subredditName.trim()) return;
    setSubredditLoading(true);
    setSubredditError(null);
    try {
      const res = await fetch(`/api/subreddit/${encodeURIComponent(subredditName.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed with status ${res.status}`);
      }
      const json = await res.json();
      setSubredditData(json);
    } catch (err) {
      setSubredditData(null);
      setSubredditError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubredditLoading(false);
    }
  };
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4">
      <img className="object-contain w-1/2 max-w-[250px] mx-auto" src="/snoo.png" alt="Snoo" />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-center text-gray-900 ">
          {username ? `Hey ${username} 👋` : ''}
        </h1>
        <p className="text-base text-center text-gray-600 ">
          Edit <span className="bg-[#e5ebee]  px-1 py-0.5 rounded">src/client/App.tsx</span> to get
          started.
        </p>
      </div>
      <div className="flex items-center justify-center mt-5">
        <button
          className="flex items-center justify-center bg-[#d93900] text-white w-14 h-14 text-[2.5em] rounded-full cursor-pointer font-mono leading-none transition-colors"
          onClick={decrement}
          disabled={loading}
        >
          -
        </button>
        <span className="text-[1.8em] font-medium mx-5 min-w-[50px] text-center leading-none text-gray-900">
          {loading ? '...' : count}
        </span>
        <button
          className="flex items-center justify-center bg-[#d93900] text-white w-14 h-14 text-[2.5em] rounded-full cursor-pointer font-mono leading-none transition-colors"
          onClick={increment}
          disabled={loading}
        >
          +
        </button>
      </div>

      {/* Subreddit Info Fetch Section */}
      <div className="w-full max-w-xl mt-8 px-4">
        <form onSubmit={fetchSubreddit} className="flex gap-2 items-stretch">
          <input
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Enter subreddit name (e.g. askreddit)"
            value={subredditName}
            onChange={(e) => setSubredditName(e.target.value)}
          />
            <button
              type="submit"
              className="bg-[#d93900] text-white px-4 py-2 rounded text-sm disabled:opacity-60"
              disabled={subredditLoading}
            >
              {subredditLoading ? 'Loading...' : 'Fetch'}
            </button>
        </form>
        <div className="mt-4">
          {subredditError && (
            <div className="text-sm text-red-600 mb-2">Error: {subredditError}</div>
          )}
          {subredditData != null && (
            <div className="space-y-3">
              {(() => {
                const sd: any = subredditData;
                const icon = sd?.data?.iconUrl;
                if (icon) {
                  return (
                    <div className="flex items-center gap-3">
                      <img
                        src={icon}
                        alt="Subreddit Icon"
                        className="w-12 h-12 rounded border border-gray-300 object-cover bg-white"
                      />
                      <div className="text-sm text-gray-800">
                        <div className="font-semibold">{sd?.data?.name}</div>
                        <div className="text-xs text-gray-500">ID: {sd?.data?.id}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              <pre className="text-xs bg-gray-900 text-green-200 p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                {String(
                  JSON.stringify(
                    (subredditData as any)?.data ? (subredditData as any) : subredditData,
                    null,
                    2
                  )
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 text-[0.8em] text-gray-600">
        <button
          className="cursor-pointer"
          onClick={() => navigateTo('https://developers.reddit.com/docs')}
        >
          Docs
        </button>
        <span className="text-gray-300">|</span>
        <button
          className="cursor-pointer"
          onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
        >
          r/Devvit
        </button>
        <span className="text-gray-300">|</span>
        <button
          className="cursor-pointer"
          onClick={() => navigateTo('https://discord.com/invite/R7yu2wh9Qz')}
        >
          Discord
        </button>
      </footer>
    </div>
  );
};
