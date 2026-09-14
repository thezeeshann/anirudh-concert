"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Looping concert footage behind everything. Muted + playsInline + autoplay is
 * the only combination browsers will start without a gesture.
 *
 * Reports readiness upward so the layers above can switch blend modes: over the
 * video the album art tints, but with no video it has to light the page itself.
 */
export function VideoBackdrop({ onActive }: { onActive: (active: boolean) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    // Some browsers ignore the autoplay attribute but honour an explicit call.
    const kick = () => {
      v.play().catch(() => {
        // Autoplay refused (rare when muted). The procedural layers carry the
        // background on their own, so there is nothing to recover from.
        setReady(false);
        onActive(false);
      });
    };
    kick();

    // A muted background loop has no business burning battery on a hidden tab.
    const onVisibility = () => {
      if (document.hidden) v.pause();
      else kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [onActive]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
      style={{
        opacity: ready ? 1 : 0,
        filter: "saturate(1.15) brightness(0.52) contrast(1.05)",
      }}
      src="/bg.mp4"
      poster="/anirudh.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      onCanPlay={() => {
        setReady(true);
        onActive(true);
      }}
      onError={() => {
        setReady(false);
        onActive(false);
      }}
    />
  );
}
