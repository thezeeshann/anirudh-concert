"use client";
import { useEffect, useState } from "react";

/**
 * Seeded at a fixed 15 so server and client render the same first paint — the
 * drift only starts after hydration, which keeps React quiet.
 */
export function useOnlineCount(seed = 15): number {
  const [n, setN] = useState(seed);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setN((v) => Math.min(28, Math.max(9, v + (Math.random() < 0.5 ? -1 : 1))));
      // Jittered, because a perfectly periodic counter reads as fake.
      timer = setTimeout(tick, 3200 + Math.random() * 2600);
    };
    timer = setTimeout(tick, 3200 + Math.random() * 2600);
    return () => clearTimeout(timer);
  }, []);

  return n;
}
