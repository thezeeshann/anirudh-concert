import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "அனிருத் கச்சேரி — Anirudh Concert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read once at module scope: none of this depends on the request.
const portrait = await readFile(join(process.cwd(), "public/anirudh.jpg"), "base64");
const portraitSrc = `data:image/jpeg;base64,${portrait}`;

// Satori can't use next/font's woff2, so the TTFs are committed under assets/.
// Reading them from disk keeps the build free of any network call.
const poppinsMedium = await readFile(join(process.cwd(), "assets/Poppins-Medium.ttf"));
const poppinsBlack = await readFile(join(process.cwd(), "assets/Poppins-Black.ttf"));

export default function Image() {
  return new ImageResponse(
    (
      // Satori supports flexbox only — no grid.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#07050a",
          position: "relative",
        }}
      >
        {/* the portrait, bled across the right and faded into the dark */}
        <img
          src={portraitSrc}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 34%",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(100deg, #07050a 26%, rgba(7,5,10,0.78) 56%, rgba(7,5,10,0.2) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 108,
              fontWeight: 900,
              letterSpacing: -5,
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
              marginTop: 14,
              fontSize: 44,
              letterSpacing: 14,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "Poppins",
            }}
          >
            CONCERT
          </div>
          <div style={{ display: "flex", marginTop: 30, alignItems: "center" }}>
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
                color: "rgba(255,255,255,0.75)",
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
