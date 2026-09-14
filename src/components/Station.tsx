"use client";
import { Background } from "./Background";
import { Header } from "./Header";
import { PlayerPill } from "./PlayerPill";
import { Wordmark } from "./Wordmark";
import { usePlayer, YT_HOST_ID } from "@/hooks/usePlayer";
import type { Track } from "@/lib/types";

export function Station({ tracks }: { tracks: Track[] }) {
  const player = usePlayer(tracks);
  const nextTrack = tracks[(player.index + 1) % tracks.length];

  return (
    <>
      <Background artwork={player.track.artwork} nextArtwork={nextTrack.artwork} />

      {/*
        The YouTube API replaces this node with its iframe. It must never be
        conditionally rendered or remounted: the player instance is created once
        and kept for the whole session, which is what lets tracks after the first
        auto-play on iOS without another tap.
      */}
      <div id={YT_HOST_ID} aria-hidden tabIndex={-1} />

      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-between">
        <Header />

        <div className="flex flex-1 items-center justify-center pt-24">
          <Wordmark />
        </div>

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
