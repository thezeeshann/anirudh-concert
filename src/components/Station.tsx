"use client";
import { Background } from "./Background";
import { Header } from "./Header";
import { PlayerPill } from "./PlayerPill";
import { usePlayer, YT_SHELL_ID } from "@/hooks/usePlayer";
import type { Track } from "@/lib/types";

export function Station({ tracks }: { tracks: Track[] }) {
  const player = usePlayer(tracks);
  const nextTrack = tracks[(player.index + 1) % tracks.length];

  return (
    <>
      <Background artwork={player.track.artwork} nextArtwork={nextTrack.artwork} />

      {/*
        Holds the YouTube iframe. Must never be conditionally rendered or
        remounted: the player is created once and kept for the whole session,
        which is what lets tracks after the first auto-play on iOS without
        another tap. React deliberately renders it empty — the iframe is
        appended outside the reconciler.
      */}
      <div id={YT_SHELL_ID} aria-hidden tabIndex={-1} />

      {/* Header is fixed, so the page is just the scene with the player resting
          on the bottom edge. */}
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-end">
        <Header />

        <div
          className="flex w-full justify-center pb-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {player.status === "blocked" ? (
            <BlockedNotice />
          ) : (
            <PlayerPill player={player} notice={player.notice} />
          )}
        </div>
      </main>
    </>
  );
}

function BlockedNotice() {
  return (
    <div className="mx-3 max-w-md rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-center backdrop-blur-2xl">
      <p className="text-sm font-semibold text-white">Playback blocked</p>
      <p className="mt-1 text-[13px] leading-relaxed text-white/70">
        Your ad blocker is stopping YouTube&rsquo;s player from loading. Allow it for this site and
        reload to start listening.
      </p>
    </div>
  );
}
