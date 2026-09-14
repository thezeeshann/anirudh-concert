"use client";
import { useEffect, useState } from "react";
import { fmtClock } from "@/lib/format";

/**
 * Returns null until after hydration — the server and the client would otherwise
 * disagree about the time. Callers reserve the width so nothing shifts.
 */
export function useClock(): string | null {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setTime(fmtClock(new Date()));
      // Re-align to the next minute boundary instead of ticking every second.
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return time;
}
