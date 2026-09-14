"use client";
import { useCallback, useEffect, useRef } from "react";
import { fmtDuration } from "@/lib/format";
import type { Progress } from "@/lib/types";

/**
 * Writes straight to the DOM. Progress ticks at 4Hz and re-rendering React that
 * often for a moving bar would be pure waste; the CSS transition interpolates
 * between samples so it still reads as smooth.
 */
export function SeekBar({
  subscribe,
  onSeek,
  fallbackMs,
  disabled,
}: {
  subscribe: (fn: (p: Progress) => void) => () => void;
  onSeek: (fraction: number) => void;
  fallbackMs: number;
  disabled?: boolean;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const total = useRef<HTMLSpanElement>(null);
  const scrubbing = useRef(false);
  const ratio = useRef(0);

  const paint = useCallback((r: number) => {
    ratio.current = r;
    if (fill.current) fill.current.style.transform = `scaleX(${r})`;
    if (thumb.current) thumb.current.style.left = `${r * 100}%`;
    if (rail.current) rail.current.setAttribute("aria-valuenow", String(Math.round(r * 100)));
  }, []);

  useEffect(() => {
    return subscribe(({ position, duration }) => {
      const d = duration > 0 ? duration : fallbackMs / 1000;
      // While a finger is down the bar follows the finger, not the player.
      if (!scrubbing.current) paint(d > 0 ? Math.min(position / d, 1) : 0);
      if (now.current) now.current.textContent = fmtDuration(scrubbing.current ? ratio.current * d : position);
      if (total.current) total.current.textContent = fmtDuration(d);
    });
  }, [subscribe, fallbackMs, paint]);

  const ratioFromEvent = (clientX: number) => {
    const box = rail.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubbing.current = true;
    paint(ratioFromEvent(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!scrubbing.current) return;
    paint(ratioFromEvent(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    const r = ratioFromEvent(e.clientX);
    paint(r);
    onSeek(r);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = e.key === "ArrowRight" ? 0.03 : e.key === "ArrowLeft" ? -0.03 : 0;
    if (!step) return;
    e.preventDefault();
    const r = Math.min(Math.max(ratio.current + step, 0), 1);
    paint(r);
    onSeek(r);
  };

  return (
    <div className="mt-2">
      <div
        ref={rail}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        // Generous touch target around a thin visual rail.
        className={`group/bar relative -my-2 py-2 outline-none ${
          disabled ? "cursor-default" : "cursor-pointer"
        } touch-none`}
      >
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            ref={fill}
            className="h-full w-full origin-left rounded-full bg-white/90 transition-transform duration-[260ms] ease-linear"
            style={{ transform: "scaleX(0)", willChange: "transform" }}
          />
        </div>
        <div
          ref={thumb}
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100 group-focus/bar:opacity-100"
          style={{ left: "0%" }}
        />
      </div>
      <div className="mt-1.5 text-[11px] tabular-nums text-white/60">
        <span ref={now}>0:00</span> / <span ref={total}>{fmtDuration(fallbackMs / 1000)}</span>
      </div>
    </div>
  );
}
