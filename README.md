# anirudh

A one-page listening site: press play, get 21 Anirudh Ravichander tracks back to back.
Controls are play/pause, next and previous — nothing else. Visual cue taken from
[saloon.wtf](https://saloon.wtf/).

```bash
npm run dev      # http://localhost:3000
npm run tracks   # regenerate src/data/tracks.json (only when the playlist changes)
npm run build
```

## How it plays music

A single hidden YouTube IFrame player. No login, no API key, no Premium requirement —
which is why it's YouTube rather than Spotify, whose Web Playback SDK needs both an OAuth
login and a Premium account from every listener.

Two rules in `src/hooks/usePlayer.ts` are load-bearing and easy to break by accident:

1. **The player is created once and never destroyed.** iOS grants media user-activation to
   the `<video>` inside the iframe, and tearing the player down throws that away — every
   later track would then need its own tap. Track changes go through `loadVideoById()`.
2. **`#yt-host` must stay rendered, sized and on-screen.** `display:none`, `visibility:hidden`,
   zero size and offscreen transforms all cause browsers to suspend playback. It keeps a real
   320×180 box and is simply invisible (`opacity: 0`, `z-index: -1`).

Each track carries up to three candidate video ids. If one fails at runtime (error 101/150,
"embedding disabled"), the player silently tries the next; if all fail, the track is marked
dead and skipped. `scripts/build-tracks.mjs` already checks `playableInEmbed` at generation
time, so this path should stay cold.

## The playlist data

`src/data/tracks.json` is a **committed build artifact** — the deployed site makes no
API calls. Regenerate it with `npm run tracks`, which:

- searches YouTube and ranks candidates by how closely their length matches the known
  Spotify duration, with bonuses for `- Topic` and label channels and penalties for
  covers/remixes/8D/ringtone re-uploads
- verifies each survivor is actually embeddable before keeping it
- pulls 600×600 cover art from the iTunes Search API, matched on duration so it can't
  attach the wrong recording

`scripts/overrides.json` hand-pins ids where search picks wrong — currently the Tamil (not
Hindi) *Vikram* title track, plus *The Paradise Theme*, *Ain't Nobody* and *Pathikichu*.
HTTP responses cache to `scripts/.cache/`, so re-runs are nearly free; `--fresh` bypasses it.

The playlist contains three songs twice under different Spotify URIs. All 21 slots are kept
because that's the playlist as given; each distinct song is only resolved once.

## The online count

Real, not decorative. Every open tab POSTs a heartbeat to `/api/presence` every 15s and gets
the current headcount back; tabs that stop checking in are dropped after 45s, and closing one
fires a `sendBeacon` so it leaves immediately rather than lingering.

**The one caveat**: the route keeps its state in a module-scope `Map`, so the count is per
server instance. That is exact for `next dev`, `next start`, and any single-container host
(Railway, Render, Fly, a VPS). On a platform that spreads requests over several instances —
Vercel's serverless functions in particular — each instance only sees its own share, so the
number would read low. Backing it with Redis is a two-function swap inside
`src/app/api/presence/route.ts`; nothing else in the app changes.

## The background

Six layers in `src/components/Background.tsx`, all animating transform and opacity only so they
stay on the compositor:

0. `public/bg.jpg` — the concert illustration, on a 70-second pan/zoom so the page breathes
   without ever pulling focus. There is no centre text: the scene carries the page, with only
   the header and the player over it.
1. the current cover, blurred and blended as `mix-blend-mode: color`, crossfading on every
   track change — the scene stays legible and simply takes on the track's palette.
2. four drifting radial-gradient stage lights (no blur filter — a radial gradient already
   *is* a soft falloff, and adding one is the usual reason these backgrounds stutter on phones)
3. drifting dust on a single canvas — 60 particles on desktop, 24 on mobile, capped at 12fps
   and paused when the tab is hidden
4. film grain from an inline SVG `feTurbulence`, jittered with a stepped transform
5. a static vignette

Under `prefers-reduced-motion` the drift stops and the canvas is never mounted; the crossfade
stays, because it carries information.

## Assets

`public/bg.jpg` is the supplied concert illustration and is the only image in the project. It
also generates everything else: `src/app/icon.tsx` and `apple-icon.tsx` zoom into the setting
sun (a whole concert scene would be mush at 32px), and `opengraph-image.tsx` uses the full
scene behind the wordmark. All three share `src/lib/sun-icon.tsx` / read the file at module
scope, so the build makes no network calls.

Two Satori quirks worth remembering if you edit those: it ignores the `inset` shorthand, so
absolutely-positioned overlays need explicit `width`/`height`, and it has no Indic shaping —
Tamil text renders mis-composed, which is why the card is set in Latin.

`assets/Poppins-*.ttf` are committed because Satori (which renders the OG image) can't read
next/font's woff2, and reading them from disk keeps the build free of network calls.

## Notes

Hidden audio-only playback isn't what YouTube's embedded player terms envisage — worth knowing
before pointing anything bigger than a personal page at it. `previewUrl` (a 30-second iTunes
clip) is stored on every track as a ready-made fallback if that ever matters.
