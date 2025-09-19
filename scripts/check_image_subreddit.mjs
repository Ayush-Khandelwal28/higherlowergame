#!/usr/bin/env node
/**
 * Fetch the top image posts for subreddits listed in data/picture_subreddits.json.
 * New: Availability mode — only check which subs have at least N image posts
 * available and save that subreddit list to JSON (no posts saved).
 *
 * Auth: OAuth client_credentials (app-only) to avoid 429s.
 * Endpoint: https://oauth.reddit.com/r/<subreddit>/top?t=<timeframe>&limit=<limit>
 *
 * Output (default): data/picture_posts.json (override with OUT env var)
 * Availability output (default): data/available_picture_subreddits.json
 *   - override with OUT_AVAILABLE env var or --out-available
 * Each entry: { subreddit, id, title, score, createdAt, author, permalink, imageUrl }
 *
 * Usage examples (PowerShell):
 *   $env:REDDIT_CLIENT_ID="..."; $env:REDDIT_CLIENT_SECRET="..."; node scripts/fetch-image-posts.mjs
 *   node scripts/fetch-image-posts.mjs -t year -l 200 --concurrency 2 --delay 400
 *   OUT=data/my_picture_posts.json TIMEFRAME=all node scripts/fetch-image-posts.mjs
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(process.cwd());
const DATA_DIR = path.join(ROOT, 'data');
const DEFAULT_SUBS_REL = process.env.SUBS_FILE || 'data/picture_subreddit.json';
const DEFAULT_OUT_REL = process.env.OUT || 'data/picture_posts.json';
const DEFAULT_OUT_AVAILABLE_REL = process.env.OUT_AVAILABLE || 'data/available_picture_subreddits.json';

// ---- Args parsing -----------------------------------------------------------
function parseArgs(argv){
  const args = argv.slice(2);
  const res = {
    timeframeFromArg: null,
    limitFromArg: null,
    delayFromArg: null,
    concurrencyFromArg: null,
    startFromArg: null,
    maxSubsFromArg: null,
    subsFileFromArg: null,
    outAvailableFromArg: null,
  minPostsFromArg: null,
  savePostsFromArg: null,
  };
  for(let i=0;i<args.length;i++){
    const a = args[i];
    const takeNext = () => { const v = args[i+1]; i++; return v; };
    if(/^-t(=|$)/.test(a) || /^--timeframe(=|$)/.test(a)){
      const [,inline] = a.split('=');
      res.timeframeFromArg = (inline || takeNext() || '').toLowerCase();
    } else if(/^-l(=|$)/.test(a) || /^--limit(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val && /^\d+$/.test(val)) res.limitFromArg = parseInt(val,10);
    } else if(/^--delay(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val && /^\d+$/.test(val)) res.delayFromArg = parseInt(val,10);
    } else if(/^--concurrency(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val && /^\d+$/.test(val)) res.concurrencyFromArg = parseInt(val,10);
    } else if(/^--start(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val && /^\d+$/.test(val)) res.startFromArg = parseInt(val,10);
    } else if(/^--max-subs(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val && /^\d+$/.test(val)) res.maxSubsFromArg = parseInt(val,10);
    } else if(/^--subs-file(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val) res.subsFileFromArg = val;
    } else if(/^--out-available(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val) res.outAvailableFromArg = val;
    } else if(/^--min-posts(=|$)/.test(a)){
      const [,inline] = a.split('=');
      const val = inline || takeNext();
      if(val && /^\d+$/.test(val)) res.minPostsFromArg = parseInt(val,10);
    } else if(/^--save-posts$/.test(a)){
      res.savePostsFromArg = true;
    }
  }
  return res;
}

const { timeframeFromArg, limitFromArg, delayFromArg, concurrencyFromArg, startFromArg, maxSubsFromArg, subsFileFromArg, outAvailableFromArg, minPostsFromArg, savePostsFromArg } = parseArgs(process.argv);
const TIMEFRAME = (timeframeFromArg || process.env.TIMEFRAME || 'year').toLowerCase();
const SAVE_POSTS = savePostsFromArg || process.env.SAVE_POSTS === '1' || process.env.SAVE_POSTS === 'true';
const PER_SUB_LIMIT = SAVE_POSTS ? Math.max(1, Math.min(200, limitFromArg ?? parseInt(process.env.LIMIT || '200', 10))) : 0; // fetch posts only if saving
const DELAY_MS = delayFromArg ?? parseInt(process.env.DELAY || '400', 10);
const CONCURRENCY = Math.max(1, Math.min(3, concurrencyFromArg ?? parseInt(process.env.CONCURRENCY || '1', 10)));
const START_INDEX = startFromArg ?? parseInt(process.env.START || '0', 10);
const MAX_SUBS = maxSubsFromArg ?? parseInt(process.env.MAX_SUBS || '100', 10);
const INCLUDE_NSFW = process.env.INCLUDE_NSFW === '1' || process.env.INCLUDE_NSFW === 'true';
const subsCandidate = subsFileFromArg || DEFAULT_SUBS_REL;
const SUBS_FILE = path.isAbsolute(subsCandidate) ? subsCandidate : path.join(ROOT, subsCandidate);
const outAvailCandidate = outAvailableFromArg || DEFAULT_OUT_AVAILABLE_REL;
const OUT_AVAILABLE = path.isAbsolute(outAvailCandidate) ? outAvailCandidate : path.join(ROOT, outAvailCandidate);
const outPostsCandidate = DEFAULT_OUT_REL;
const OUT_FILE = path.isAbsolute(outPostsCandidate) ? outPostsCandidate : path.join(ROOT, outPostsCandidate);
const MIN_POSTS = Math.max(1, minPostsFromArg ?? parseInt(process.env.MIN_POSTS || '10', 10));

const VALID_TIMEFRAMES = new Set(['hour','day','week','month','year','all']);
if(!VALID_TIMEFRAMES.has(TIMEFRAME)){
  console.error(`Invalid TIMEFRAME=${TIMEFRAME}. Use one of: ${Array.from(VALID_TIMEFRAMES).join(', ')}`);
  process.exit(1);
}

// ---- OAuth token management -------------------------------------------------
const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
if(!CLIENT_ID || !CLIENT_SECRET){
  console.error('Missing REDDIT_CLIENT_ID and/or REDDIT_CLIENT_SECRET env vars.');
  process.exit(1);
}
const USER_AGENT = process.env.REDDIT_USER_AGENT || 'higherlowergame/0.0.0 (picture_subs top200 fetcher)';

async function delay(ms){
  return new Promise(r=>setTimeout(r, ms));
}

let oauthToken = null; // { token, expiresAt }
async function obtainToken(){
  const body = new URLSearchParams();
  body.set('grant_type','client_credentials');
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: body.toString(),
  });
  if(!res.ok){
    const text = await res.text().catch(()=> '');
    throw new Error(`Token fetch failed: HTTP ${res.status} ${text}`);
  }
  const json = await res.json();
  const expiresIn = json.expires_in ? Number(json.expires_in) : 3600;
  oauthToken = { token: json.access_token, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
  return oauthToken.token;
}
async function getToken(){
  if(oauthToken && oauthToken.expiresAt > Date.now()) return oauthToken.token;
  return obtainToken();
}

// ---- Rate limit observance --------------------------------------------------
const rateState = { remaining: Infinity, resetSec: 60 };
function updateRateFromHeaders(res){
  const remaining = parseFloat(res.headers.get('x-ratelimit-remaining') || '0');
  const reset = parseFloat(res.headers.get('x-ratelimit-reset') || '60');
  if(!Number.isNaN(remaining)) rateState.remaining = remaining;
  if(!Number.isNaN(reset)) rateState.resetSec = reset;
}
async function maybeRespectRateLimit(){
  if(rateState.remaining <= 1){
    const waitMs = Math.max(1000, (rateState.resetSec * 1000) + 250);
    console.log(`  Rate limit reached. Waiting ${Math.round(waitMs/1000)}s...`);
    await delay(waitMs);
  }
}

// ---- Subreddit list parsing (JSON) -----------------------------------------
function parseSubredditsFromJson(filePath){
  if(!fs.existsSync(filePath)){
    throw new Error(`Missing ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  /** @type {string[]} */
  let list = [];
  try {
    list = JSON.parse(raw);
  } catch (e){
    throw new Error(`Failed to parse JSON from ${filePath}: ${e?.message || e}`);
  }
  const set = new Set();
  for(const item of list){
    if(typeof item !== 'string') continue;
    const trimmed = item.trim();
    // Accept forms: "pics", "r/pics", "https://www.reddit.com/r/pics", "https://old.reddit.com/r/pics/"
    let sub = null;
    // URL form
    try {
      if(/^https?:\/\//i.test(trimmed)){
        const u = new URL(trimmed);
        const parts = u.pathname.split('/').filter(Boolean);
        const rIdx = parts.findIndex(p=>p.toLowerCase()==='r');
        if(rIdx !== -1 && parts[rIdx+1]){
          sub = parts[rIdx+1];
        }
      }
    } catch {}
    // r/<name> or bare name
    if(!sub){
      const m = /^(?:r\/)?([A-Za-z0-9_]+)$/.exec(trimmed);
      if(m) sub = m[1];
    }
    if(sub){
      set.add(sub);
    }
  }
  return Array.from(set);
}

function tryResolveSubsFile(){
  const candidates = [
    SUBS_FILE,
    path.isAbsolute(DEFAULT_SUBS_REL) ? DEFAULT_SUBS_REL : path.join(ROOT, DEFAULT_SUBS_REL),
    path.join(ROOT, 'data', 'picture_subreddit.json'),
    path.join(ROOT, 'picture_subreddit.json'),
    path.join(ROOT, 'picture_subreddits.json'),
    path.join(ROOT, 'data', 'picture_subreddits.json'),
    path.join(ROOT, 'subreddits.json'),
    path.join(ROOT, 'subs.json'),
  ];
  for(const p of candidates){
    try{
      if(fs.existsSync(p)) return p;
    }catch{}
  }
  return SUBS_FILE;
}

// ---- Image selection helpers ------------------------------------------------
function htmlUnescape(u){
  if(!u) return u;
  return u.replace(/&amp;/g, '&');
}

function isImageUrl(url){
  return typeof url === 'string' && /\.(jpg|jpeg|png|gif|webp)(?:\?.*)?$/i.test(url);
}

function selectBestImageFromMediaMetadata(post){
  const gallery = post?.gallery_data;
  const media = post?.media_metadata;
  if(!gallery || !media) return null;
  const firstItem = Array.isArray(gallery.items) ? gallery.items[0] : null;
  const id = firstItem?.media_id || firstItem?.id;
  if(!id) return null;
  const meta = media[id];
  if(!meta) return null;
  // Prefer source 's' then largest in 'p'
  const s = meta?.s;
  if(s?.u) return htmlUnescape(s.u);
  const previews = Array.isArray(meta?.p) ? meta.p : [];
  let best = null;
  for(const p of previews){
    const u = p?.u;
    if(u && (!best || (p.x||0)*(p.y||0) > (best.x||0)*(best.y||0))){
      best = p;
    }
  }
  return best?.u ? htmlUnescape(best.u) : null;
}

function selectBestImageUrl(post){
  // 1) Gallery posts
  if(post?.is_gallery){
    const u = selectBestImageFromMediaMetadata(post);
    if(u) return u;
  }
  // 2) Preview images
  const preview = post?.preview;
  const images = Array.isArray(preview?.images) ? preview.images : [];
  if(images.length > 0){
    const source = images[0]?.source;
    if(source?.url) return htmlUnescape(source.url);
    const resolutions = images[0]?.resolutions || [];
    if(resolutions.length > 0){
      const last = resolutions[resolutions.length - 1];
      if(last?.url) return htmlUnescape(last.url);
    }
  }
  // 3) Direct URL override
  const direct = post?.url_overridden_by_dest || post?.url;
  if(isImageUrl(direct)) return htmlUnescape(direct);
  return null;
}

function isImagePost(post){
  if(!post) return false;
  if(!INCLUDE_NSFW && post.over_18) return false;
  if(post.post_hint === 'image') return true;
  if(post.is_gallery) return true;
  if(selectBestImageUrl(post)) return true;
  return false;
}

// ---- Fetching ---------------------------------------------------------------
async function fetchTopPage(subreddit, limit=25, after){
  await maybeRespectRateLimit();
  const token = await getToken();
  const url = new URL(`https://oauth.reddit.com/r/${subreddit}/top`);
  url.searchParams.set('t', TIMEFRAME);
  url.searchParams.set('limit', String(Math.min(100, Math.max(1, limit))));
  if(after) url.searchParams.set('after', after);
  url.searchParams.set('raw_json','1');
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    }
  });
  updateRateFromHeaders(res);
  if(!res.ok){
    if(res.status === 401){
      await obtainToken();
      return fetchTopPage(subreddit, limit, after);
    }
    const text = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

async function fetchTopImagePostsForSubreddit(subreddit, desiredCount){
  const maxToScan = Math.max(desiredCount, Math.min(1000, desiredCount * 3));
  let after = undefined;
  const results = [];
  while(results.length < desiredCount){
    const remainingToFetch = Math.min(100, Math.max(1, maxToScan - results.length));
    const json = await fetchTopPage(subreddit, remainingToFetch, after);
    const children = json?.data?.children || [];
    if(children.length === 0) break;
    for(const c of children){
      const d = c?.data;
      if(!d) continue;
      if(!isImagePost(d)) continue;
      const imageUrl = selectBestImageUrl(d);
      if(!imageUrl) continue;
      results.push({
        subreddit: d.subreddit || subreddit,
        id: d.id ?? null,
        title: d.title || null,
        score: d.score ?? null,
        createdAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
        author: d.author || null,
        permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : null,
        imageUrl,
      });
      if(results.length >= desiredCount) break;
    }
    after = json?.data?.after;
    if(!after) break;
  }
  return results.slice(0, desiredCount);
}

async function hasAtLeastNImagePosts(subreddit, n){
  const maxToScan = Math.max(n, Math.min(1000, n * 3));
  let after = undefined;
  let count = 0;
  while(count < n){
    const remainingToFetch = Math.min(100, Math.max(1, maxToScan - count));
    const json = await fetchTopPage(subreddit, remainingToFetch, after);
    const children = json?.data?.children || [];
    if(children.length === 0) break;
    for(const c of children){
      const d = c?.data;
      if(!d) continue;
      if(!isImagePost(d)) continue;
      const imageUrl = selectBestImageUrl(d);
      if(!imageUrl) continue;
      count++;
      if(count >= n) break;
    }
    if(count >= n) break;
    after = json?.data?.after;
    if(!after) break;
  }
  return count >= n;
}

async function runInBatches(items, concurrency, worker, delayBetween=0){
  const results = [];
  let index = 0;
  let active = 0;
  return new Promise((resolve) => {
    const next = () => {
      if(index >= items.length && active === 0){
        resolve(results);
        return;
      }
      while(active < concurrency && index < items.length){
        const currentIndex = index++;
        const item = items[currentIndex];
        active++;
        Promise.resolve(worker(item, currentIndex))
          .then(r=>{ if(Array.isArray(r)) results.push(...r); else if(r!=null) results.push(r); })
          .catch(e=>{ console.warn('Worker error:', e?.message || e); })
          .finally(async ()=>{
            active--;
            if(delayBetween > 0) await delay(delayBetween);
            next();
          });
      }
    };
    next();
  });
}

// ---- Main -------------------------------------------------------------------
async function main(){
  const subsPath = tryResolveSubsFile();
  const subs = parseSubredditsFromJson(subsPath);
  const sliced = subs.slice(START_INDEX, START_INDEX + MAX_SUBS);
  console.log(`Found ${subs.length} subreddits in ${path.relative(ROOT, subsPath)}; using ${sliced.length} starting at index ${START_INDEX}.`);
  console.log(`Mode: availability check (minPosts=${MIN_POSTS})${SAVE_POSTS ? ` + save posts (perSub=${PER_SUB_LIMIT})` : ''}. Concurrency=${CONCURRENCY}.`);

  let processed = 0;
  const availableSubs = [];
  const perSubResults = await runInBatches(sliced, CONCURRENCY, async (name, idx)=>{
    try {
      if((idx+1) % 10 === 0) console.log(`  Progress: ${idx+1}/${sliced.length} subreddits processed...`);
      const ok = await hasAtLeastNImagePosts(name, MIN_POSTS);
      if(ok){
        availableSubs.push(name);
      }
      // If user also wants posts, fetch; otherwise skip
      if(SAVE_POSTS && PER_SUB_LIMIT > 0){
        const list = await fetchTopImagePostsForSubreddit(name, PER_SUB_LIMIT);
        processed++;
        return list;
      }
      processed++;
      return [];
    } catch (e){
      console.warn(`Failed to fetch r/${name}:`, e?.message || e);
      return [];
    }
  }, DELAY_MS);

  console.log(`Availability: ${availableSubs.length}/${sliced.length} subs have at least ${MIN_POSTS} image posts.`);
  if(SAVE_POSTS) console.log(`Fetched ${perSubResults.length} posts total across ${processed} subreddits.`);

  // Write output: ensure directories exist for chosen paths
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  try { fs.mkdirSync(path.dirname(OUT_AVAILABLE), { recursive: true }); } catch {}
  // Save availability list
  fs.writeFileSync(OUT_AVAILABLE, JSON.stringify(availableSubs, null, 2));
  console.log(`Saved ${availableSubs.length} available subreddits to ${OUT_AVAILABLE}`);

  // Save posts output only if there are entries
  if(SAVE_POSTS && perSubResults.length > 0){
    try { fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true }); } catch {}
    const output = {
      source: 'oauth.reddit.com/r/<sub>/top',
      timeframe: TIMEFRAME,
      perSubredditLimit: PER_SUB_LIMIT,
      includeNsfw: INCLUDE_NSFW,
      totalSubreddits: sliced.length,
      total: perSubResults.length,
      fetchedAt: new Date().toISOString(),
      entries: perSubResults,
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Saved ${perSubResults.length} entries to ${OUT_FILE}`);
  }
}

main().catch(err=>{
  console.error('Fetch picture_subs top200 failed:', err);
  process.exitCode = 1;
});


