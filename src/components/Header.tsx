"use client";
import { useClock } from "@/hooks/useClock";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { SPOTIFY_URL, YTMUSIC_URL } from "@/lib/constants";
import { ArrowIcon, SpotifyIcon, YTMusicIcon } from "./icons";

const shadow = "drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]";

function Clock() {
  const time = useClock();
  // Width is reserved so the real value landing after hydration shifts nothing.
  return (
    <span className={`min-w-[4.5ch] text-sm font-medium tabular-nums text-white ${shadow}`}>
      {time ?? " "}
    </span>
  );
}

function OnlineBadge() {
  const n = useOnlineCount();
  return (
    <div
      className={`inline-flex items-center gap-2 text-sm font-medium text-white ${shadow}`}
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
      </span>
      <span className="tabular-nums">{n}</span>
      <span className="text-white/70">online</span>
    </div>
  );
}

function Pill({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`group flex items-center gap-2 rounded-full p-2.5 text-sm font-medium text-white transition hover:opacity-80 active:scale-95 sm:py-2 sm:pl-3 sm:pr-3.5 ${shadow}`}
    >
      {children}
      {/* Labels collapse on mobile so the pills can't collide with the clock. */}
      <span className="hidden sm:inline">{label}</span>
      <ArrowIcon className="hidden h-3.5 w-3.5 -rotate-45 opacity-50 transition group-hover:opacity-90 sm:inline" />
    </a>
  );
}

export function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
      <div className="pointer-events-auto flex-1">
        <Clock />
      </div>
      <div className="pointer-events-auto">
        <OnlineBadge />
      </div>
      <div className="pointer-events-auto flex flex-1 items-center justify-end gap-1 sm:gap-2">
        <Pill href={SPOTIFY_URL} label="Spotify">
          <SpotifyIcon className="h-[18px] w-[18px]" />
        </Pill>
        <Pill href={YTMUSIC_URL} label="YT Music">
          <YTMusicIcon className="h-[18px] w-[18px]" />
        </Pill>
      </div>
    </header>
  );
}
