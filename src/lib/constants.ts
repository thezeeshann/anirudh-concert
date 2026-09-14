export const SPOTIFY_URL =
  "https://open.spotify.com/playlist/5qbRhFtdGR2LGRDGGzlUqT";
export const YTMUSIC_URL =
  "https://music.youtube.com/search?q=Anirudh+Ravichander";

/** Progress push rate. A CSS transition smooths the gaps, so 4Hz looks like 60fps. */
export const PROGRESS_INTERVAL_MS = 250;
/** If play() doesn't take within this window, assume iOS Low Power Mode and retry muted. */
export const PLAY_WATCHDOG_MS = 2500;
export const API_TIMEOUT_MS = 10_000;
export const ARTWORK_FADE_MS = 1200;
