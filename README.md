# Anirudh Live Concert

A one-page listening site for a fixed 21-track Anirudh Ravichander playlist. Land on it, press
play, and the songs run back to back. Built with Next.js 16, React 19 and TailwindCSS 4.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - App Router, fully static output
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Full-length playback** - A hidden YouTube IFrame player, so no login or API key is needed
- **Four controls** - Play/pause, next, previous and a seekable progress bar
- **Live listener count** - `/api/presence` counts real open tabs by heartbeat
- **Generated icons** - Favicon, Apple touch icon and OG card built from one source photo
- **Mobile responsive** - `dvh` units and safe-area insets so the player clears browser chrome

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the site.

## Playlist Data

`src/data/tracks.json` is a committed build artifact, so the deployed site makes no API calls.
Regenerate it only when the playlist changes:

```bash
npm run tracks
```

The script reads `scripts/playlist.input.json`, resolves each song to embeddable YouTube video
ids and cover art, and writes the result. Use `scripts/overrides.json` to hand-pin an id when
search picks the wrong upload.

## Project Structure

```
anirudh/
├── assets/                     # Fonts for the OG image renderer
├── public/                     # bg.jpg, anirudh.jpg
├── scripts/                    # Playlist resolver and its input
└── src/
    ├── app/                    # Routes, layout, generated icons and OG card
    ├── components/             # Station, Background, Header, PlayerPill, SeekBar
    ├── data/                   # tracks.json
    ├── hooks/                  # usePlayer, useClock, useOnlineCount
    └── lib/                    # Types, formatters, icon crop maths
```

There is no `index.html`. `src/app/layout.tsx` produces the `<html>` and `<head>`, and the
`icon` / `apple-icon` / `opengraph-image` files emit their own `<link>` and `<meta>` tags.

## Available Scripts

- `npm run dev`: Start the development server on port 3000
- `npm run build`: Build for production
- `npm run start`: Serve the production build
- `npm run tracks`: Regenerate `src/data/tracks.json` from the playlist seed

## Deployment

Set `NEXT_PUBLIC_SITE_URL` to the real origin, or link previews will not resolve the OG image.
