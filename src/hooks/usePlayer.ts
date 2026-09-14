"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "./useYouTubeApi";
import { PLAY_WATCHDOG_MS, PROGRESS_INTERVAL_MS } from "@/lib/constants";
import type { PlayerStatus, Progress, Track } from "@/lib/types";

export const YT_HOST_ID = "yt-host";

type ProgressListener = (p: Progress) => void;

export type PlayerApi = {
  status: PlayerStatus;
  index: number;
  track: Track;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  /** Transient sub-label, e.g. after a track had to be skipped. */
  notice: string | null;
  /** Push-based so the 4Hz progress tick never re-renders the React tree. */
  subscribeProgress: (fn: ProgressListener) => () => void;
};

export function usePlayer(tracks: Track[]): PlayerApi {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  }, []);

  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const playerRef = useRef<YT.Player | null>(null);
  const activeRef = useRef({ ti: 0, ci: 0 });
  const dirRef = useRef<1 | -1>(1);
  const wantPlayRef = useRef(false);
  /** Track indices whose every candidate failed. Never retried. */
  const deadRef = useRef<Set<number>>(new Set());
  /** YouTube fires onError two or three times for one bad load; collapse them. */
  const errHandledRef = useRef(false);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subsRef = useRef<Set<ProgressListener>>(new Set());
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<PlayerStatus>("idle");
  const setStatusBoth = useCallback((s: PlayerStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  /* ---------------- progress ---------------- */
  const emit = useCallback(() => {
    const p = playerRef.current;
    if (!p?.getCurrentTime) return;
    const position = p.getCurrentTime() ?? 0;
    const duration = p.getDuration?.() ?? 0;
    for (const fn of subsRef.current) fn({ position, duration });
  }, []);

  const startTicker = useCallback(() => {
    if (tickerRef.current) return;
    tickerRef.current = setInterval(emit, PROGRESS_INTERVAL_MS);
    emit();
  }, [emit]);

  const stopTicker = useCallback(() => {
    if (!tickerRef.current) return;
    clearInterval(tickerRef.current);
    tickerRef.current = null;
  }, []);

  const subscribeProgress = useCallback((fn: ProgressListener) => {
    subsRef.current.add(fn);
    return () => {
      subsRef.current.delete(fn);
    };
  }, []);

  /* ---------------- loading ---------------- */
  const loadCandidate = useCallback(
    (ti: number, ci: number, autoplay: boolean) => {
      const player = playerRef.current;
      const track = tracksRef.current[ti];
      if (!player || !track) return;

      errHandledRef.current = false;
      activeRef.current = { ti, ci };
      setIndex(ti);
      setStatusBoth(autoplay ? "loading" : "ready");
      for (const fn of subsRef.current) fn({ position: 0, duration: 0 });

      const args = { videoId: track.youtube[ci], suggestedQuality: "small" as const };
      if (autoplay) player.loadVideoById(args);
      else player.cueVideoById(args);
    },
    [setStatusBoth]
  );

  const skipTrack = useCallback(
    (dir: 1 | -1) => {
      const list = tracksRef.current;
      const from = activeRef.current.ti;
      // Bounded by the list length, so this can never spin.
      for (let step = 1; step <= list.length; step++) {
        const ti = (((from + dir * step) % list.length) + list.length) % list.length;
        if (!deadRef.current.has(ti)) {
          loadCandidate(ti, 0, wantPlayRef.current);
          return;
        }
      }
      setStatusBoth("exhausted");
    },
    [loadCandidate, setStatusBoth]
  );

  /** Single funnel for every failure mode: bad id, embed block, instant end. */
  const failCurrent = useCallback(() => {
    if (errHandledRef.current) return;
    errHandledRef.current = true;

    const { ti, ci } = activeRef.current;
    const track = tracksRef.current[ti];
    if (track && ci + 1 < track.youtube.length) {
      loadCandidate(ti, ci + 1, wantPlayRef.current); // same song, next upload
      return;
    }
    deadRef.current.add(ti);
    flashNotice("Unavailable — skipping");
    skipTrack(dirRef.current); // direction-aware: Prev keeps walking backwards
  }, [loadCandidate, skipTrack, flashNotice]);

  /* ---------------- transport ---------------- */
  const clearWatchdog = () => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
  };

  const play = useCallback(() => {
    wantPlayRef.current = true;
    const p = playerRef.current;
    if (!p) return;
    // Synchronous — the gesture's user-activation must not be spent on a microtask.
    p.playVideo();

    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      if (statusRef.current === "playing" || statusRef.current === "loading") return;
      // iOS Low Power Mode refuses unmuted playback even with a gesture.
      // Starting muted usually slips through; unmute the instant it takes.
      try {
        p.mute();
        p.playVideo();
        setTimeout(() => {
          if (statusRef.current === "playing") p.unMute();
        }, 600);
      } catch {
        /* nothing more we can do; the UI keeps showing Play */
      }
    }, PLAY_WATCHDOG_MS);
  }, []);

  const pause = useCallback(() => {
    wantPlayRef.current = false;
    clearWatchdog();
    playerRef.current?.pauseVideo();
  }, []);

  const toggle = useCallback(() => {
    if (statusRef.current === "playing" || statusRef.current === "loading") pause();
    else play();
  }, [pause, play]);

  const next = useCallback(() => {
    dirRef.current = 1;
    wantPlayRef.current = true;
    skipTrack(1);
  }, [skipTrack]);

  const prev = useCallback(() => {
    dirRef.current = -1;
    wantPlayRef.current = true;
    // Restart the current song first, the way every real player behaves.
    const p = playerRef.current;
    if (p?.getCurrentTime && p.getCurrentTime() > 3) {
      p.seekTo(0, true);
      p.playVideo();
      return;
    }
    skipTrack(-1);
  }, [skipTrack]);

  /* ---------------- player lifecycle ---------------- */
  useEffect(() => {
    let cancelled = false;

    const onReady = () => {
      if (statusRef.current === "idle") setStatusBoth("ready");
    };

    const onStateChange = (e: YT.OnStateChangeEvent) => {
      const S = window.YT!.PlayerState;
      switch (e.data) {
        case S.PLAYING:
          clearWatchdog();
          errHandledRef.current = true; // committed; ignore any late stray error
          setStatusBoth("playing");
          startTicker();
          break;
        case S.PAUSED:
          stopTicker();
          setStatusBoth("paused");
          break;
        case S.BUFFERING:
          setStatusBoth("loading");
          break;
        case S.CUED:
          if (wantPlayRef.current) playerRef.current?.playVideo();
          break;
        case S.ENDED: {
          stopTicker();
          const t = playerRef.current?.getCurrentTime?.() ?? 0;
          // A region-blocked stub ends instantly and never fires onError. Treat
          // that as a failure, not as a finished song, or we'd tear through all
          // 21 tracks in a couple of seconds.
          if (t < 2) {
            failCurrent();
            return;
          }
          dirRef.current = 1;
          skipTrack(1);
          break;
        }
      }
    };

    loadYouTubeApi()
      .then((YTns) => {
        if (cancelled || playerRef.current) return;
        playerRef.current = new YTns.Player(YT_HOST_ID, {
          videoId: tracksRef.current[0].youtube[0],
          width: 320,
          height: 180,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            iv_load_policy: 3,
            cc_load_policy: 0,
            playsinline: 1, // without this iOS hijacks into native fullscreen
            enablejsapi: 1,
            // Must match the embedding page exactly or the postMessage bridge
            // dies silently — so it's computed, never hardcoded.
            origin: window.location.origin,
          },
          events: { onReady, onStateChange, onError: () => failCurrent() },
        });
      })
      .catch(() => {
        if (!cancelled) setStatusBoth("blocked");
      });

    return () => {
      cancelled = true;
      stopTicker();
      clearWatchdog();
      // Only ever runs during the dev StrictMode double-mount, long before any
      // gesture — see the comment on the effect below about never remounting.
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // Deliberately empty: the player is created exactly once per session and is
    // never rebuilt. iOS grants media user-activation to the iframe's <video>
    // element, and destroying the player throws that away — every later track
    // would then need its own tap. Track changes go through loadVideoById.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* iOS suspends the iframe when the tab is hidden; re-assert intent on return. */
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      if (wantPlayRef.current && statusRef.current === "paused") {
        playerRef.current?.playVideo();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return {
    status,
    index,
    track: tracks[index],
    play,
    pause,
    toggle,
    next,
    prev,
    notice,
    subscribeProgress,
  };
}
