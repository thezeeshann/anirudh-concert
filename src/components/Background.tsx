"use client";
import { useEffect, useRef, useState } from "react";
import { ParticleField } from "./ParticleField";
import { ARTWORK_FADE_MS } from "@/lib/constants";

/**
 * Five stacked layers. Everything that moves animates transform/opacity only, so
 * it all stays on the compositor and off the main thread.
 */
export function Background({ artwork, nextArtwork }: { artwork: string; nextArtwork?: string }) {
  // Two artwork layers that trade places, so a track change crossfades.
  const [layers, setLayers] = useState<[string, string]>([artwork, ""]);
  const [showB, setShowB] = useState(false);
  const showBRef = useRef(false);
  // Which artwork is live, held in a ref rather than read back out of state:
  // deriving it from `layers` would put `layers` in the dep array below, and the
  // effect would then re-enter on its own setLayers before the ref had flipped.
  const liveRef = useRef(artwork);

  useEffect(() => {
    if (!artwork || liveRef.current === artwork) return;
    liveRef.current = artwork;

    // Preload first: flip early and you crossfade to an empty rectangle.
    // No crossOrigin here — it would make this a second, separate fetch instead
    // of warming the very cache entry the CSS background-image goes on to use.
    const img = new Image();
    img.src = artwork;

    let cancelled = false;
    const swap = () => {
      if (cancelled) return;
      const toB = !showBRef.current;
      showBRef.current = toB;
      setLayers((prev) => (toB ? [prev[0], artwork] : [artwork, prev[1]]));
      // Paint the new layer at opacity 0 first, then let the transition run.
      requestAnimationFrame(() => {
        if (!cancelled) setShowB(toB);
      });
    };

    if (img.complete) swap();
    else {
      img.onload = swap;
      img.onerror = swap; // a broken cover must not freeze the background
    }
    return () => {
      cancelled = true;
    };
  }, [artwork]);

  // Warm the next cover so its crossfade is instant.
  useEffect(() => {
    if (!nextArtwork) return;
    const img = new Image();
    img.src = nextArtwork;
  }, [nextArtwork]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07050a]">
      {/* L1 — album art, blurred to a colour wash */}
      {([0, 1] as const).map((i) => (
        <div
          key={i}
          className="art-scale absolute inset-0 transition-opacity ease-in-out"
          style={{
            opacity: (i === 1) === showB && layers[i] ? 1 : 0,
            transitionDuration: `${ARTWORK_FADE_MS}ms`,
            animationDelay: `${i * -12}s`,
          }}
        >
          <div
            className="absolute inset-[-12%] bg-cover bg-center"
            style={{
              backgroundImage: layers[i] ? `url(${layers[i]})` : undefined,
              filter: "blur(72px) saturate(1.7) brightness(0.62)",
            }}
          />
        </div>
      ))}

      {/* L2 — stage lights. Radial gradients are already a perfect falloff, so
          no blur filter here: adding one is the classic mobile-jank mistake. */}
      <div className="absolute inset-0 mix-blend-screen">
        <div
          className="aurora aurora-a absolute left-[-20%] top-[-25%] h-[90vmax] w-[90vmax] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle at 50% 50%, #ff2d78 0%, transparent 68%)" }}
        />
        <div
          className="aurora aurora-b absolute right-[-25%] top-[-10%] h-[80vmax] w-[80vmax] rounded-full opacity-45"
          style={{ background: "radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 68%)" }}
        />
        <div
          className="aurora aurora-c absolute bottom-[-30%] left-[10%] h-[95vmax] w-[95vmax] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle at 50% 50%, #f59e0b 0%, transparent 66%)" }}
        />
        <div
          className="aurora aurora-d absolute bottom-[-20%] right-[-15%] h-[75vmax] w-[75vmax] rounded-full opacity-45"
          style={{ background: "radial-gradient(circle at 50% 50%, #8b5cf6 0%, transparent 68%)" }}
        />
      </div>

      {/* L3 — dust */}
      <ParticleField />

      {/* L4 — film grain */}
      <div className="grain absolute inset-[-5%] opacity-[0.055] mix-blend-overlay" />

      {/* L5 — vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.5) 72%, rgba(0,0,0,0.82) 100%)",
        }}
      />
    </div>
  );
}
