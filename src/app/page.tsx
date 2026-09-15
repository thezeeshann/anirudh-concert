import { Station } from "@/components/Station";
import data from "@/data/tracks.json";
import { shuffleTracks } from "@/lib/shuffle";
import type { TracksFile } from "@/lib/types";

// Rendered per request so every visitor gets their own running order. Shuffling
// on the server rather than in the browser keeps the markup and the hydrated
// tree identical — a client-side shuffle would mismatch, or flash track 1
// before swapping.
export const dynamic = "force-dynamic";

export default function Home() {
  const { tracks } = data as TracksFile;
  // Fixed for the session once picked: next/prev walk this order, so the
  // playlist stays predictable while you are listening.
  return <Station tracks={shuffleTracks(tracks)} />;
}
