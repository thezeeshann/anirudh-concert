import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Anirudh — Live Concert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read once at module scope: none of this depends on the request.
const scene = await readFile(join(process.cwd(), "public/bg.jpg"), "base64");
const sceneSrc = `data:image/jpeg;base64,${scene}`;

// Satori can't read next/font's woff2, so the TTFs are committed under assets/.
// Reading them from disk keeps the build free of any network call.
const poppinsMedium = await readFile(join(process.cwd(), "assets/Poppins-Medium.ttf"));
const poppinsBlack = await readFile(join(process.cwd(), "assets/Poppins-Black.ttf"));

export default function Image() {
  return new ImageResponse(
    (
      // Satori supports flexbox only — no grid.
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1a0d0c" }}>
        <img
          src={sceneSrc}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />
        {/* Dark ramp from the left so the type always has something to sit on.
            Satori ignores the `inset` shorthand, hence the explicit box. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            display: "flex",
            background:
              "linear-gradient(95deg, rgba(10,5,5,0.96) 18%, rgba(10,5,5,0.8) 44%, rgba(10,5,5,0.1) 82%)",
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
