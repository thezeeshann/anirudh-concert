import { Station } from "@/components/Station";
import data from "@/data/tracks.json";
import type { TracksFile } from "@/lib/types";

// Static: the playlist is a committed build artifact, so there is nothing to
// revalidate and no request-time work to do.
export const dynamic = "force-static";

export default function Home() {
  const { tracks } = data as TracksFile;
  return <Station tracks={tracks} />;
}
