## Higher / Lower: Reddit Edition

An immersive Reddit-themed guessing game built on Devvit. Pick which subreddit or post has higher numbers and climb the leaderboards across multiple modes.

### What is the goal?
Score as high as you can by correctly predicting which subreddit has the higher members or which post got more upvotes.

---

## Game Modes

All modes share a clean, fast UI with animated feedback and best score tracking. Scores can be submitted to a global leaderboard.

### Classic (Subreddit Higher/Lower)
Predict whether the right subreddit has a higher or lower subscriber count than the left.

- Left subreddit is always revealed (name + subscriber count)
- Right subreddit starts hidden; pick “Higher” or “Lower”
- Correct: Your score increases and the right subreddit carries over to next round.
- Wrong: The round ends; game over


### Mystery (Pick the Higher Subreddit)
Choose the subreddit that has more subscribers. Both counts are hidden until you pick.

- Two subreddit tiles, both with hidden counts
- Pick left or right
- Correct: Score +1, then two new subreddits are shown
- Wrong: Game over


### Beat The Clock (Timed)
Race to score as many correct answers as possible before time runs out. Two variants:

- Classic Rush: Same rules as Classic, but you aren’t eliminated for mistakes. You just lose time and progress to the next pair.
- Mystery Rush: Same as Mystery, and mistakes don’t end the game, they’re counted and you keep going until timer hits 0.

Shared behavior:
- 60-second countdown
- Score and mistake counters shown in the header


### Versus (Which Post Won)
Two image posts from a chosen subreddit go head-to-head. Guess whether the right post’s upvotes are higher or lower than the left post’s upvotes.

- Select a subreddit to play from a searchable list of subs with enough image posts
- Left post’s upvotes are shown, right is hidden
- Guess Higher or Lower
- Correct: Score +1, the right post carries over to face a new challenger
- Wrong: Game over

Additional constraints:
- Image-only posts
- Minimum upvotes filter (default ≥ 10) to keep rounds meaningful
- Pairing prefers a decisive difference: by default one post’s upvotes must be at least 2× the other (configurable)

### Leaderboards
View top scores for all modes and your own rank if available.

### Data Sources
- Classic/Mystery (Both Streak and Timed) : Top 2000 Subreddits by member count.
- Versus : All time too 200 posts from 100 curated Subreddits.


---

## Technical Architecture

### Project structure

- `src/client`: Vite + React full-screen webview
  - Components: game UIs (`ClassicGame`, `MysteryGame`, `BeatTheClock`, `PostCard`, `SubredditCard`, `Leaderboard`, `LandingPage`)
  - Pages: route-level wrappers for each mode
  - Hooks: encapsulated game logic (`useMysteryGame`, `useClassicGame`, timed variants), leaderboard, countdown, etc.
  - Assets: `assets/` for icons and loaders

- `src/server`: Express server running in Devvit’s serverless runtime
  - Uses `@devvit/web/server` for `createServer`, `redis`, `reddit`, `context`, `getServerPort`
  - REST endpoints for leaderboard, subreddit info, post fetching, init, increment/decrement
  - Offline posts dataset for the server is read from `data/posts.json` when present (see Offline Data Files)

- `src/shared`: Shared TypeScript types used by both client and server
  - `types/api.ts` defines API contracts and common models

- `data/`: Offline JSON datasets
  - `subreddits.json` and `picture_posts.json` consumed by client hooks/components

### Implementation Details

- Frameworks: React, Vite, Tailwind, TypeScript

Client-only dev helper:
- `npm run dev:vite` runs a local Vite dev server on port 7474 for the client UI only (no Devvit runtime). Useful for quick UI tweaks.

Important hooks:
- `useMysteryGame` and `useClassicGame`: pure gameplay state machines with reveal delays and best tracking
- `useClassicTimed` and `useMysteryTimed`: time-optimized loops for quick feedback and continuous rounds
- `useCountdown`: precise timer based on `performance.now()` with configurable resolution
- `useLeaderboard`: GET/POST to server for fetching top entries and submitting scores

### Server details

Runs in Devvit’s serverless Node environment via `@devvit/web/server`.

Endpoints:
- `GET /api/leaderboard?mode=...&limit=...` → returns top N and user rank
- `POST /api/leaderboard/submit` `{ mode, score }` → stores if higher than previous
- `GET /api/subreddit/:name` → fetches subreddit info and best-effort icon
- `GET /api/posts?subreddit=...&source=top|hot|new&time=...&limit=...&minScore=...&includeNsfw=...` → returns `PostLite[]` from offline dataset if available, else fetches from Reddit JSON
  - Server looks for `data/posts.json` with shape `{ entries: PostLiteLike[] }` and serves from it if present. See Offline Data Files for format tips.
- `GET /api/init`, `POST /api/increment`, `POST /api/decrement` → sample endpoints (used by starter)

Storage:
- Redis is available via `redis` import, leaderboards use sorted sets keyed by `lb:<mode>`
- No local Redis setup needed in Devvit playtest, it’s provided by the runtime.

Auth/Identity:
- `reddit.getCurrentUsername()` provides current username in Devvit runtime to tie scores to users

### Shared types

- `src/shared/types/api.ts` exports types for all API payloads, `LeaderboardMode`, `PostLite`, etc.

---

### Datasets

- Subreddits: `data/subreddits.json` Top 2000 subreddits by member count for classic and mystery modes.
- Posts : `data/picture_posts.json` All time top 200 Posts for curated Subreddits used by Versus mode.
- Subreddits : `data/picture_subreddits.json` 100 Curated subreddits with majorly SFW image posts.


### Scripts

- **fetch:subreddits**: Fetches batches of popular subreddits (no auth) and writes a merged, sorted list to `data/subreddits.json`.
- **fetch:image_posts**: Fetches top image posts for subreddits listed in `data/picture_subreddits.json` and writes to `data/picture_posts.json`.
-**check_image_subreddit.mjs**: Checks if a list of subreddit has enough image posts.

---

## Credits

- Built with Devvit, React, Vite, Express, Tailwind, and TypeScript
- Uses Reddit public data and/or offline datasets for gameplay

## License

MIT
