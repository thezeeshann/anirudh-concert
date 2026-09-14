import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const scene = await readFile(join(process.cwd(), "public/bg.jpg"), "base64");
const sceneSrc = `data:image/jpeg;base64,${scene}`;

/**
 * A favicon is 16-32px in practice, so the whole concert scene would be mush.
 * This zooms into the setting sun over the skyline — at icon size it reads as a
 * warm disc, which survives the scale-down.
 *
 * Source is 1586x992; the sun sits near (505, 410) and is ~90px across.
 */
export function sunIcon(edge: number) {
  // Keep the sun at ~78% of the frame whatever size is asked for.
  const scale = (edge * 0.78) / 90;
  const w = Math.round(1586 * scale);
  const h = Math.round(992 * scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "#c2451f",
        }}
      >
        <img
          src={sceneSrc}
          width={w}
          height={h}
          style={{
            position: "absolute",
            width: w,
            height: h,
            left: Math.round(edge / 2 - 505 * scale),
            top: Math.round(edge / 2 - 410 * scale),
          }}
        />
      </div>
    ),
    { width: edge, height: edge }
  );
}
