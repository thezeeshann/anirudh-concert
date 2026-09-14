"use client";
import { useEffect, useRef, useState } from "react";
import { ParticleField } from "./ParticleField";
import { ARTWORK_FADE_MS } from "@/lib/constants";

/**
 * Layered over the concert artwork in public/bg.jpg. Everything that moves
 * animates transform or opacity only, so it all stays on the compositor and off
 * the main thread.
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
      {/* L0 — the concert scene, drifting slowly so the page is never quite still */}
      <div className="stage-drift absolute inset-[-6%]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/bg.jpg)", filter: "brightness(0.68) saturate(1.05)" }}
        />
      </div>

      {/* L1 — album art, blended as colour only: the scene stays legible and
          simply takes on the current track's palette. */}
      {([0, 1] as const).map((i) => (
        <div
          key={i}
          className="art-scale absolute inset-0 transition-opacity ease-in-out"
          style={{
            opacity: (i === 1) === showB && layers[i] ? 0.45 : 0,
            mixBlendMode: "color",
            transitionDuration: `${ARTWORK_FADE_MS}ms`,
            animationDelay: `${i * -12}s`,
          }}
        >
          <div
            className="absolute inset-[-12%] bg-cover bg-center"
            style={{
              backgroundImage: layers[i] ? `url(${layers[i]})` : undefined,
              filter: "blur(72px) saturate(1.7)",
            }}
          />
        </div>
      ))}

      {/* L2 — stage lights, kept low so they lift the scene rather than fight it.
          Radial gradients are already a soft falloff, so no blur filter here:
          adding one is the classic mobile-jank mistake. */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen">
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

      {/* L3 — drifting dust, catching the stage light */}
      <ParticleField />

      {/* L4 — film grain */}
      <div className="grain absolute inset-[-5%] opacity-[0.05] mix-blend-overlay" />

      {/* L5 — vignette, so the wordmark and the player always have something to sit on */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 68%, rgba(0,0,0,0.8) 100%)",
        }}
      />
    </div>
  );
}
