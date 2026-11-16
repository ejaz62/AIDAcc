import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name} — ${site.fullName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social-sharing image (also used for Twitter/X cards). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0b0e19 0%, #181a4d 60%, #282e85 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 26,
              background: "linear-gradient(135deg, #4c5efa, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 60,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{site.fullName}</div>
          <div style={{ fontSize: 32, color: "#9db1ff" }}>Learning for a world shaped by artificial intelligence</div>
        </div>
      </div>
    ),
    size,
  );
}
