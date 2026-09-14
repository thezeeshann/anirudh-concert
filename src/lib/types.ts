export type Track = {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
  /** Embeddable video ids, best match first. Tried in order if one fails at runtime. */
  youtube: string[];
  artwork: string;
  artworkSmall: string;
  previewUrl: string | null;
  spotifyUri: string;
};

export type TracksFile = { generatedAt: string; tracks: Track[] };

export type PlayerStatus =
  | "idle" // player not constructed yet
  | "ready" // cued, waiting for the first gesture
  | "loading"
  | "playing"
  | "paused"
  | "blocked" // the IFrame API never loaded (ad blocker / CSP)
  | "exhausted"; // every track failed

export type Progress = { position: number; duration: number };
