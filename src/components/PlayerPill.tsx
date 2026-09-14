"use client";
import { SeekBar } from "./SeekBar";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons";
import type { PlayerApi } from "@/hooks/usePlayer";

export function PlayerPill({ player, notice }: { player: PlayerApi; notice: string | null }) {
  const { track, status, toggle, next, prev, seek, subscribeProgress } = player;
  const spinning = status === "playing";
  const busy = status === "loading";
  const dead = status === "blocked" || status === "exhausted";

  return (
    <div className="w-full max-w-xl px-3 sm:px-6">
      <div className="flex items-center gap-3 rounded-[28px] border border-white/20 bg-white/10 p-3 shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:gap-4 sm:rounded-full sm:pr-5">
        {/* spinning record */}
        <div className="relative h-14 w-14 shrink-0 sm:h-20 sm:w-20">
          <div
            className="disc h-full w-full overflow-hidden rounded-full shadow-lg ring-1 ring-white/20"
            style={{
              animation: "spin 8s linear infinite",
              animationPlayState: spinning ? "running" : "paused",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.artworkSmall}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 ring-2 ring-white/40" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white drop-shadow-sm sm:text-[15px]">
            {track.title}
          </p>
          <p className="truncate text-[12px] text-white/70 sm:text-[13px]">
            {dead ? "Playback unavailable" : (notice ?? track.artist)}
          </p>
          <SeekBar
            subscribe={subscribeProgress}
            onSeek={seek}
            fallbackMs={track.durationMs}
            disabled={dead}
          />
        </div>

        {/* On phones the transport moves below the title so nothing is cramped. */}
        <div className="hidden items-center gap-1 sm:flex">
          <Transport {...{ toggle, next, prev, spinning, busy, dead }} />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 sm:hidden">
        <Transport {...{ toggle, next, prev, spinning, busy, dead }} />
      </div>
    </div>
  );
}

function Transport({
  toggle,
  next,
  prev,
  spinning,
  busy,
  dead,
}: {
  toggle: () => void;
  next: () => void;
  prev: () => void;
  spinning: boolean;
  busy: boolean;
  dead: boolean;
}) {
  const ghost =
    "grid h-10 w-10 cursor-pointer place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95 disabled:cursor-default disabled:opacity-40 sm:h-9 sm:w-9";
  return (
    <>
      <button type="button" onClick={prev} disabled={dead} aria-label="Previous track" className={ghost}>
        <PrevIcon className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        onClick={toggle}
        disabled={dead}
        aria-label={spinning ? "Pause" : "Play"}
        aria-pressed={spinning}
        className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 active:scale-95 disabled:cursor-default disabled:opacity-40 sm:h-11 sm:w-11"
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
        ) : spinning ? (
          <PauseIcon className="h-5 w-5" />
        ) : (
          <PlayIcon className="h-5 w-5 translate-x-[1px]" />
        )}
      </button>
      <button type="button" onClick={next} disabled={dead} aria-label="Next track" className={ghost}>
        <NextIcon className="h-[18px] w-[18px]" />
      </button>
    </>
  );
}
