import type { Track } from "./types";

const key = (t: Track) => t.youtube[0];

/** Would moving `from` into slot `to` sit next to a copy of itself? */
function fits(list: Track[], from: number, to: number) {
  const before = to - 1 === from ? undefined : list[to - 1];
  const after = to + 1 === from ? undefined : list[to + 1];
  return (
    (!before || key(before) !== key(list[from])) && (!after || key(after) !== key(list[from]))
  );
}

/**
 * Fisher-Yates, plus a repair pass.
 *
 * The playlist holds three songs twice (they appear under two Spotify URIs
 * each), and a plain shuffle is free to land both copies side by side — which
 * just sounds like the player is stuck. Any adjacent pair that shares a video
 * id is swapped with a later entry that breaks the run at both ends.
 */
export function shuffleTracks(tracks: Track[]): Track[] {
  const out = [...tracks];

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  for (let i = 1; i < out.length; i++) {
    if (key(out[i]) !== key(out[i - 1])) continue;
    // Scanned from a random offset and wrapping: the whole list is eligible (a
    // pair on the last two slots has nothing after it to trade with), and
    // starting at 0 every time would park the repaired track at the front far
    // more often than chance.
    const offset = Math.floor(Math.random() * out.length);
    for (let step = 0; step < out.length; step++) {
      const k = (offset + step) % out.length;
      if (k === i || k === i - 1) continue;
      if (fits(out, k, i) && fits(out, i, k)) {
        [out[i], out[k]] = [out[k], out[i]];
        break;
      }
      // No partner works (impossible with this playlist) — leave the pair be
      // rather than shuffling forever.
    }
  }

  return out;
}
