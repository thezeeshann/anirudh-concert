import { API_TIMEOUT_MS } from "@/lib/constants";

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Module-level singleton so React 19's StrictMode double-mount can't inject the
 * script twice.
 */
let apiPromise: Promise<typeof YT> | null = null;

export function loadYouTubeApi(): Promise<typeof YT> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<typeof YT>((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("yt-api-blocked"));
    document.head.appendChild(script);

    // Not redundant with onerror: several blockers answer this URL with an empty
    // 200, so onerror never fires and onYouTubeIframeAPIReady is never defined.
    // The timeout is the only way to notice.
    setTimeout(() => reject(new Error("yt-api-timeout")), API_TIMEOUT_MS);
  });

  return apiPromise;
}
