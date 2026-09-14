"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Dust = { x: number; y: number; r: number; a: number; vy: number; sway: number; phase: number };

/**
 * One canvas rather than N divs: fifty animated elements would mean fifty
 * compositor layers and guaranteed jank on a phone.
 */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const count = mobile ? 24 : 60;
    // Full DPR on a 3x phone quadruples fill cost for dust nobody inspects.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0;
    let h = 0;
    const dust: Dust[] = [];

    const seed = () => {
      dust.length = 0;
      for (let i = 0; i < count; i++) {
        dust.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.6,
          a: 0.04 + Math.random() * 0.14,
          vy: 0.08 + Math.random() * 0.22,
          sway: 0.15 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!dust.length) seed();
    };
    resize();

    let raf = 0;
    let last = 0;
    let t = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return; // a hidden tab still bills you
      if (now - last < 83) return; // ~12fps; indistinguishable for drifting dust
      last = now;
      t += 0.016;

      ctx.clearRect(0, 0, w, h);
      for (const d of dust) {
        d.y -= d.vy;
        if (d.y < -4) {
          d.y = h + 4;
          d.x = Math.random() * w;
        }
        const x = d.x + Math.sin(t * d.sway + d.phase) * 12;
        ctx.globalAlpha = d.a;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  // Don't merely freeze it under reduced motion — never allocate the canvas.
  if (reduced) return null;

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
