"use client";
import { useEffect, useRef } from "react";
import { fmtDuration } from "@/lib/format";
import type { Progress } from "@/lib/types";

/**
 * Writes straight to the DOM. Progress ticks at 4Hz and re-rendering React that
 * often for a moving bar would be pure waste; the CSS transition interpolates
 * between samples so it still reads as smooth.
 */
export function SeekBar({
  subscribe,
  fallbackMs,
}: {
  subscribe: (fn: (p: Progress) => void) => () => void;
  fallbackMs: number;
}) {
  const fill = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const total = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return subscribe(({ position, duration }) => {
      const d = duration > 0 ? duration : fallbackMs / 1000;
      if (fill.current) {
        fill.current.style.transform = `scaleX(${d > 0 ? Math.min(position / d, 1) : 0})`;
      }
      if (now.current) now.current.textContent = fmtDuration(position);
      if (total.current) total.current.textContent = fmtDuration(d);
    });
  }, [subscribe, fallbackMs]);

  return (
    <div className="mt-2">
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
        <div
          ref={fill}
          className="h-full w-full origin-left rounded-full bg-white/90 transition-transform duration-[260ms] ease-linear"
          style={{ transform: "scaleX(0)", willChange: "transform" }}
        />
      </div>
      <div className="mt-1.5 text-[11px] tabular-nums text-white/60">
        <span ref={now}>0:00</span> / <span ref={total}>{fmtDuration(fallbackMs / 1000)}</span>
      </div>
    </div>
  );
}
