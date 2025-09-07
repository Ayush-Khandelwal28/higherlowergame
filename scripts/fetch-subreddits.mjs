#!/usr/bin/env node
/**
 * Fetch batches of popular subreddits from Reddit's public listing API
 * and store them into a JSON file shaped to match SubredditInfoResponse.data
 * entries for later offline usage in the game.
 *
 * Data source (no auth, public):
 *   https://www.reddit.com/subreddits/popular.json?limit=100&after=<fullname>
 *
 * Usage:
 *   npm run fetch:subreddits            # default ~500 (5 pages)
 *   PAGES=10 npm run fetch:subreddits   # customize number of pages
 *   OUT=data/subreddits.json npm run fetch:subreddits
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(process.cwd());
const DATA_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(ROOT, process.env.OUT || 'data/subreddits.json');
// --- Argument & env parsing -------------------------------------------------
// Priority for pages: explicit flag/positional > env PAGES > default 5
function parseArgs(argv){
  const args = argv.slice(2);
  let pagesFromArg = null;
  for(let i=0;i<args.length;i++){
    const a = args[i];
    if(/^-p(=|$)/.test(a) || /^--pages(=|$)/.test(a)){
      const [,valueInline] = a.split('=');
      let val = valueInline;
      if(!val){
        val = args[i+1];
        i++;
      }
      if(val && /^\d+$/.test(val)) pagesFromArg = parseInt(val,10);
    } else if(!a.startsWith('-') && /^\d+$/.test(a)) {
      pagesFromArg = parseInt(a,10);
    }
  }
  return { pagesFromArg };
}

const { pagesFromArg } = parseArgs(process.argv);
const PAGES = pagesFromArg ?? parseInt(process.env.PAGES || '5', 10); // up to 10 => 1000 entries
const DELAY_MS = parseInt(process.env.DELAY || '750', 10); // politeness delay

async function delay(ms){
  return new Promise(r=>setTimeout(r, ms));
}

/** Shape aligned with SubredditInfoResponse.data */
function mapChild(child){
  const d = child.data || {};
  return {
    id: d.id ?? null,
    name: d.display_name ?? null,
    activeCount: d.accounts_active ?? d.active_user_count ?? null,
    subscribersCount: d.subscribers ?? null,
    isNsfw: Boolean(d.over18),
    createdAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
    iconUrl: d.icon_img || d.community_icon?.split('?')[0] || null,
  };
}

async function fetchPage(after){
  const url = new URL('https://www.reddit.com/subreddits/popular.json');
  url.searchParams.set('limit', '100');
  if(after) url.searchParams.set('after', after);

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'higherlowergame/0.0.0 (data collection script)'
    }
  });
  if(!res.ok){
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.json();
}

function loadExisting(){
  if(!fs.existsSync(OUT_FILE)) return [];
  try {
    const json = JSON.parse(fs.readFileSync(OUT_FILE,'utf8'));
    if(Array.isArray(json?.entries)) return json.entries;
  } catch (e){
    console.warn('Warning: could not parse existing data file, starting fresh.', e.message);
  }
  return [];
}

function mergeEntries(oldList, newList){
  const map = new Map();
  for(const o of oldList){
    if(o?.name) map.set(o.name, o);
  }
  for(const n of newList){
    if(!n?.name) continue;
    if(!map.has(n.name)) {
      map.set(n.name, n);
      continue;
    }
    const existing = map.get(n.name);
    // Replace fields with fresher non-null data; always update subscriber counts (they grow)
    const merged = {
      ...existing,
      subscribersCount: n.subscribersCount ?? existing.subscribersCount,
      activeCount: n.activeCount ?? existing.activeCount,
      iconUrl: n.iconUrl || existing.iconUrl || null,
      // keep earliest createdAt if both exist, else whichever is present
      createdAt: existing.createdAt || n.createdAt || null,
      isNsfw: Boolean(n.isNsfw || existing.isNsfw),
      id: existing.id || n.id || null,
    };
    map.set(n.name, merged);
  }
  return Array.from(map.values())
    .filter(e=> e.subscribersCount !== null)
    .sort((a,b)=> (b.subscribersCount||0) - (a.subscribersCount||0));
}

async function main(){
  console.log(`Fetching up to ${PAGES} pages of popular subreddits ...`);
  const all = [];
  let after = undefined;
  for(let i=0;i<PAGES;i++){
    console.log(`Page ${i+1}/${PAGES} url after=${after || 'FIRST'}`);
    const json = await fetchPage(after);
    const children = json?.data?.children || [];
    for(const c of children){
      all.push(mapChild(c));
    }
    after = json?.data?.after;
    if(!after){
      console.log('No further pages. Stopping early.');
      break;
    }
    if(i < PAGES - 1){
      await delay(DELAY_MS);
    }
  }

  // Deduplicate within this run first
  const seen = new Map();
  for(const entry of all){
    if(!entry.name) continue;
    if(!seen.has(entry.name)) seen.set(entry.name, entry);
  }
  const runList = Array.from(seen.values());

  // Merge with existing file
  const existing = loadExisting();
  const list = mergeEntries(existing, runList);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({
    source: 'reddit.com/subreddits/popular',
    fetchedAt: new Date().toISOString(),
    total: list.length,
    entries: list,
  }, null, 2));
  console.log(`Saved ${list.length} subreddit entries to ${OUT_FILE}`);
  console.log(`(Run added ${runList.length} new/updated entries; existing file had ${existing.length})`);
}

main().catch(err=>{
  console.error('Fetch failed:', err);
  process.exitCode = 1;
});
