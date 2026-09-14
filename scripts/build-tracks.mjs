#!/usr/bin/env node
/**
 * Resolves the hand-written playlist seed into src/data/tracks.json.
 *
 * Run by hand (`npm run tracks`), never at build time: the output is committed,
 * so the deployed site makes zero network calls and needs zero API keys.
 *
 * For each track we need two things YouTube/Spotify won't hand us directly:
 *   1. two or three *embeddable* YouTube video ids, best match first
 *   2. a 600x600 cover to tint the page with
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE_DIR = path.join(ROOT, "scripts/.cache");
const OUT = path.join(ROOT, "src/data/tracks.json");
const FRESH = process.argv.includes("--fresh");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
// CONSENT=YES+1 skips the EU interstitial, which otherwise replaces ytInitialData wholesale.
const HEADERS = { "user-agent": UA, "accept-language": "en-US,en;q=0.9", cookie: "CONSENT=YES+1" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const polite = () => sleep(900 + Math.random() * 500);

/* ---------- tiny on-disk cache so re-runs after a tweak cost no network ---------- */
const cache = new Map();
const cacheFile = path.join(CACHE_DIR, "http.json");
async function loadCache() {
  if (FRESH || !existsSync(cacheFile)) return;
  for (const [k, v] of Object.entries(JSON.parse(await readFile(cacheFile, "utf8")))) cache.set(k, v);
  console.log(`  cache: ${cache.size} entries`);
}
async function saveCache() {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, JSON.stringify(Object.fromEntries(cache)));
}

async function get(url) {
  if (cache.has(url)) return cache.get(url);
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      if (res.url.includes("consent.")) throw new Error("consent wall");
      cache.set(url, body);
      await polite();
      return body;
    } catch (err) {
      lastErr = err;
      await sleep(2000 * 3 ** attempt); // 2s, 6s, 18s
    }
  }
  throw lastErr;
}

/* ---------- helpers ---------- */
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)|\[.*?\]/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const toSeconds = (t) => t.split(":").map(Number).reduce((a, p) => a * 60 + p, 0);

function slug(s) {
  return norm(s).replace(/ /g, "-").slice(0, 48);
}

/** Recursively yield every plain object in a parsed JSON blob. */
function* walk(node) {
  if (Array.isArray(node)) { for (const v of node) yield* walk(v); return; }
  if (node && typeof node === "object") {
    yield node;
    for (const v of Object.values(node)) yield* walk(v);
  }
}

function extractJson(html, marker) {
  const i = html.indexOf(marker);
  if (i === -1) return null;
  // Brace-match forward from the first '{' so we don't depend on the trailing markup.
  const start = html.indexOf("{", i);
  let depth = 0, inStr = false, esc = false;
  for (let j = start; j < html.length; j++) {
    const c = html[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try { return JSON.parse(html.slice(start, j + 1)); } catch { return null; }
    }
  }
  return null;
}

/* ---------- 1. YouTube search + ranking ---------- */
// Label / artist channels whose uploads are the real master recording.
const LABELS = /sony music south|think music|divo|saregama|zee music|t-series|wunderbar|anirudh|sun pictures|lyca|ags entertainment|red giant|seven screen/i;
// Words that mark a re-upload, edit or fan version. Only penalised when the real
// track title doesn't itself contain the word.
const JUNK = ["cover", "reprise", "remix", "mashup", "ringtone", "8d", "slowed", "reverb",
  "karaoke", "instrumental", "reaction", "whatsapp status", "full movie", "jukebox", "shorts", "teaser", "trailer", "making"];

async function searchYouTube(track) {
  // sp=EgIQAQ%3D%3D filters to type=video, keeping channels and playlists out of the walk.
  const q = `${track.title} ${track.artist.split(",")[0]}`.replace(/\(.*?\)/g, " ");
  const html = await get(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`
  );
  const data = extractJson(html, "var ytInitialData = ");
  if (!data) throw new Error("no ytInitialData");

  const seen = new Set();
  const out = [];
  for (const o of walk(data)) {
    // lengthText is itself a filter: live streams, Shorts and playlist cards lack it.
    if (!o.videoId || !o.lengthText?.simpleText || !o.title?.runs?.[0]?.text) continue;
    if (seen.has(o.videoId)) continue;
    seen.add(o.videoId);
    out.push({
      id: o.videoId,
      title: o.title.runs[0].text,
      seconds: toSeconds(o.lengthText.simpleText),
      channel: o.ownerText?.runs?.[0]?.text ?? o.longBylineText?.runs?.[0]?.text ?? "",
      views: parseInt((o.viewCountText?.simpleText ?? "0").replace(/\D/g, ""), 10) || 0,
    });
  }
  return out;
}

function score(cand, track) {
  const driftSec = Math.abs(cand.seconds * 1000 - track.durationMs) / 1000;
  if (driftSec > 15) return null; // hard reject: it's a different recording
  let s = 100 - driftSec * 4;

  // Auto-generated "- Topic" channels are label-uploaded, exactly duration-matched,
  // and almost never have embedding disabled. Strongest single signal we have.
  if (/ - Topic$/.test(cand.channel)) s += 35;
  if (LABELS.test(cand.channel)) s += 25;
  if (/lyric|audio|official/i.test(cand.title)) s += 10;
  s += Math.log10(cand.views + 1) * 2;

  const wanted = norm(track.title);
  for (const w of JUNK) {
    if (cand.title.toLowerCase().includes(w) && !wanted.includes(w)) s -= 40;
  }
  // Prefer the language the playlist actually names.
  if (/\(tamil\)|- tamil/i.test(track.title) && /hindi|telugu|kannada|malayalam/i.test(cand.title)) s -= 30;
  return s;
}

/* ---------- 2. embeddability verification ---------- */
// playableInEmbed:false is exactly the condition that produces runtime error 101/150.
// Checking it here turns the app's most likely user-facing failure into a log line.
async function isEmbeddable(videoId) {
  try {
    const html = await get(`https://www.youtube.com/watch?v=${videoId}`);
    const pr = extractJson(html, "var ytInitialPlayerResponse = ");
    if (!pr) return /"playableInEmbed":true/.test(html);
    return (
      pr.playabilityStatus?.status === "OK" &&
      pr.videoDetails?.isPrivate !== true &&
      pr.playabilityStatus?.playableInEmbed !== false
    );
  } catch {
    return false;
  }
}

/* ---------- 3. artwork via the iTunes Search API ---------- */
async function findArtwork(track) {
  const bare = track.title.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
  const queries = [`${bare} ${track.artist.split(",")[0]}`, bare];
  for (const country of ["IN", "US"]) { // Tamil soundtracks are better covered in the IN storefront
    for (const term of queries) {
      const url = `https://itunes.apple.com/search?${new URLSearchParams({
        term, entity: "song", limit: "8", country,
      })}`;
      let results;
      try { results = JSON.parse(await get(url)).results ?? []; } catch { continue; }
      // Match on duration, not on name: it's what proves it's the same recording.
      const hit = results
        .map((r) => ({ r, drift: Math.abs((r.trackTimeMillis ?? 0) - track.durationMs) }))
        .sort((a, b) => a.drift - b.drift)[0];
      if (hit && hit.drift <= 4000) {
        return {
          artwork: hit.r.artworkUrl100.replace("100x100bb", "600x600bb"),
          artworkSmall: hit.r.artworkUrl100,
          previewUrl: hit.r.previewUrl ?? null,
        };
      }
    }
  }
  return null;
}

/* ---------- main ---------- */
const seed = JSON.parse(await readFile(path.join(ROOT, "scripts/playlist.input.json"), "utf8"));
const overridesPath = path.join(ROOT, "scripts/overrides.json");
const overrides = existsSync(overridesPath) ? JSON.parse(await readFile(overridesPath, "utf8")) : {};

await loadCache();
console.log(`\nResolving ${seed.length} tracks\n`);

// The playlist contains three songs twice under different Spotify URIs. All 21 slots
// are kept (that's the playlist as given), but each distinct song is resolved once.
const resolved = new Map();
const tracks = [];
const warnings = [];

for (const [i, t] of seed.entries()) {
  const key = norm(t.title);
  const label = `${String(i + 1).padStart(2, " ")}. ${t.title.slice(0, 46)}`;

  if (resolved.has(key)) {
    const prev = resolved.get(key);
    console.log(`${label.padEnd(52)} ↳ repeat of #${prev.n}`);
    tracks.push({ ...prev.track, id: `${prev.track.id}-${i}`, spotifyUri: t.spotifyUri });
    continue;
  }

  process.stdout.write(`${label.padEnd(52)} `);

  let ranked = [];
  if (overrides[t.title]) {
    ranked = overrides[t.title].map((id) => ({ id, title: "(pinned)", channel: "", seconds: 0 }));
  } else {
    const cands = await searchYouTube(t);
    ranked = cands
      .map((c) => ({ c, s: score(c, t) }))
      .filter((x) => x.s !== null)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((x) => x.c);
  }

  const good = [];
  for (const c of ranked) {
    if (await isEmbeddable(c.id)) good.push(c.id);
    if (good.length === 3) break;
  }
  if (good.length === 0) throw new Error(`No embeddable video found for "${t.title}"`);
  if (good.length < 2) warnings.push(`${t.title}: only 1 candidate — a takedown would skip it`);

  const art = await findArtwork(t);
  if (!art) warnings.push(`${t.title}: no iTunes artwork, using the YouTube thumbnail`);

  const track = {
    id: slug(t.title) || `track-${i}`,
    title: t.title,
    artist: t.artist,
    durationMs: t.durationMs,
    youtube: good,
    artwork: art?.artwork ?? `https://i.ytimg.com/vi/${good[0]}/maxresdefault.jpg`,
    artworkSmall: art?.artworkSmall ?? `https://i.ytimg.com/vi/${good[0]}/mqdefault.jpg`,
    previewUrl: art?.previewUrl ?? null,
    spotifyUri: t.spotifyUri,
  };
  resolved.set(key, { n: i + 1, track });
  tracks.push(track);

  console.log(`${good.join(" ")}  ${art ? "art" : "ART?"}  ${ranked[0]?.title.slice(0, 30) ?? ""}`);
  await saveCache();
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), tracks }, null, 2) + "\n");
await saveCache();

console.log(`\nWrote ${tracks.length} tracks -> src/data/tracks.json`);
if (warnings.length) console.log("\nWarnings:\n" + warnings.map((w) => "  ! " + w).join("\n"));
