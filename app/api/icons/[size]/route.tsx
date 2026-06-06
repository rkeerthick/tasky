import { ImageResponse } from "next/og";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: sizeStr } = await params;
  const px = Math.max(16, Math.min(1024, parseInt(sizeStr, 10) || 512));

  const strokeWidth = Math.round(px * 0.14);
  const radius = Math.round(px * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#18181b",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: `${radius}px`,
        }}
      >
        {/* Checkmark — content kept inside the maskable safe zone (central 80%) */}
        <svg
          width={px * 0.5}
          height={px * 0.5}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 53L38 75L84 28"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
