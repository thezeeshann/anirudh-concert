import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const portrait = await readFile(join(process.cwd(), "public/anirudh.jpg"), "base64");
export const portraitSrc = `data:image/jpeg;base64,${portrait}`;

/** Source is 736x1308; the face sits around (368, 455) and is ~400px tall. */
export const FACE = { w: 736, h: 1308, cx: 368, cy: 455, size: 400 };

/**
 * Square crop centred on the face. A favicon is 16-32px in practice, so the
 * full portrait would be an unreadable smudge — this fills the frame with the
 * head, which still resolves at that size.
 */
export function portraitIcon(edge: number) {
  // Keep the face at ~78% of the frame whatever size is asked for.
  const scale = (edge * 0.78) / FACE.size;
  const w = Math.round(FACE.w * scale);
  const h = Math.round(FACE.h * scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "#0a0809",
        }}
      >
        <img
          src={portraitSrc}
          width={w}
          height={h}
          style={{
            position: "absolute",
            width: w,
            height: h,
            left: Math.round(edge / 2 - FACE.cx * scale),
            top: Math.round(edge / 2 - FACE.cy * scale),
          }}
        />
      </div>
    ),
    { width: edge, height: edge }
  );
}
