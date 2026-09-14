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

## The background

No image assets. Five layers in `src/components/Background.tsx`, all animating transform and
opacity only so they stay on the compositor:

1. the current cover, blurred to a colour wash, crossfading on every track change
2. four drifting radial-gradient stage lights (no blur filter — a radial gradient already
   *is* a soft falloff, and adding one is the usual reason these backgrounds stutter on phones)
3. drifting dust on a single canvas — 60 particles on desktop, 24 on mobile, capped at 12fps
   and paused when the tab is hidden
4. film grain from an inline SVG `feTurbulence`, jittered with a stepped transform
5. a static vignette

Under `prefers-reduced-motion` the drift stops and the canvas is never mounted; the crossfade
stays, because it carries information.

## Notes

Hidden audio-only playback isn't what YouTube's embedded player terms envisage — worth knowing
before pointing anything bigger than a personal page at it. `previewUrl` (a 30-second iTunes
clip) is stored on every track as a ready-made fallback if that ever matters.
