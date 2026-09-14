"use client";
import { useEffect, useState } from "react";

const HEARTBEAT_MS = 15_000;

/**
 * Real count of tabs currently on the page, from /api/presence.
 *
 * Starts at null so the server and the first client render agree (there is no
 * honest number to print before the first heartbeat lands).
 */
export function useOnlineCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Per-tab, so two tabs count as two listeners; sessionStorage keeps the id
    // stable across reloads of the same tab.
    let id = sessionStorage.getItem("presence-id");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Math.random()).slice(2);
      sessionStorage.setItem("presence-id", id);
    }

    let alive = true;
    const beat = async () => {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id }),
          cache: "no-store",
        });
        const data = await res.json();
        if (alive && typeof data?.count === "number") setCount(data.count);
      } catch {
        /* offline or the route is down — keep showing the last known number */
      }
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);

    // Leave immediately on close rather than waiting out the TTL. pagehide is
    // the one that actually fires on mobile Safari.
    const leave = () => {
      navigator.sendBeacon?.(
        "/api/presence",
        new Blob([JSON.stringify({ id, leave: true })], { type: "application/json" })
      );
    };
    window.addEventListener("pagehide", leave);

    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, []);

  return count;
}
