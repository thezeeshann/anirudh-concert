/**
 * The concert artwork, exactly as supplied — no filter, no tint, no overlay.
 *
 * Anything layered here (a vignette, a colour wash, grain) would alter the
 * image, so there is deliberately nothing but the picture. Contrast for the
 * header and the player is handled on those elements instead: the header text
 * carries its own drop-shadow and the player sits on a frosted panel.
 */
export function Background() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-[#07050a] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/bg.jpg)" }}
      aria-hidden
    />
  );
}
