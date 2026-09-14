import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FACE, portraitSrc } from "@/lib/portrait-icon";

export const alt = "Anirudh — Live Concert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori can't read next/font's woff2, so the TTFs are committed under assets/.
// Reading them at module scope keeps the build free of any network call.
const poppinsMedium = await readFile(join(process.cwd(), "assets/Poppins-Medium.ttf"));
const poppinsBlack = await readFile(join(process.cwd(), "assets/Poppins-Black.ttf"));

export default function Image() {
  // The portrait is tall and narrow, so rather than cover-cropping it (which
  // would lose the face) it is placed as an element on the right at a scale that
  // puts the face in the upper third.
  const scale = 0.78;
  const w = Math.round(FACE.w * scale);
  const h = Math.round(FACE.h * scale);
  const left = size.width - w + 40;
  const top = Math.round(300 - FACE.cy * scale);

  return new ImageResponse(
    (
      // Satori supports flexbox only — no grid.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0809",
          overflow: "hidden",
        }}
      >
        <img src={portraitSrc} width={w} height={h} style={{ position: "absolute", left, top, width: w, height: h }} />
        {/* Dark ramp so the type always has something to sit on. Satori ignores
            the `inset` shorthand, hence the explicit box. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            display: "flex",
            background:
              "linear-gradient(95deg, #0a0809 30%, rgba(10,8,9,0.82) 52%, rgba(10,8,9,0.1) 92%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 84px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 126,
              fontWeight: 900,
              letterSpacing: -6,
              color: "#fff",
              lineHeight: 1,
              fontFamily: "Poppins",
            }}
          >
            ANIRUDH
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 38,
              letterSpacing: 15,
              color: "rgba(255,255,255,0.85)",
              fontFamily: "Poppins",
            }}
          >
            LIVE CONCERT
          </div>
          <div style={{ display: "flex", marginTop: 34, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#4ade80",
                marginRight: 14,
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "rgba(255,255,255,0.8)",
                fontFamily: "Poppins",
              }}
            >
              21 tracks · press play
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: poppinsMedium, style: "normal", weight: 500 },
        { name: "Poppins", data: poppinsBlack, style: "normal", weight: 900 },
      ],
    }
  );
}
