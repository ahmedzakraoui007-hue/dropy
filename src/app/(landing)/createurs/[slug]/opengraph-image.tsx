import { ImageResponse } from "next/og";
import { publicPortfolio } from "@/lib/creator-portfolio";

export const alt = "Portfolio de créateur sur Dropy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portfolio = await publicPortfolio(slug);
  const name = portfolio?.creator.name || "Dropy";
  const city = portfolio?.creator.city;
  const covers = (portfolio?.items || []).map((item) => item.thumbnail_url).filter((url): url is string => Boolean(url && /\.(jpe?g|png)(\?|$)/i.test(url))).slice(0, 3);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "48px", padding: "64px", background: "linear-gradient(135deg, #070A1F 0%, #2E3192 60%, #00A99D 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, opacity: 0.8 }}>DROPY · PORTFOLIO UGC</div>
          <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1.05, marginTop: 28 }}>{name}</div>
          {city && <div style={{ fontSize: 36, marginTop: 20, opacity: 0.85 }}>{city}, Tunisie</div>}
        </div>
        {covers.length > 0 && (
          <div style={{ display: "flex", gap: 16 }}>
            {covers.map((url) => (
              <img key={url} src={url} alt="" width={180} height={420} style={{ objectFit: "cover", borderRadius: 24 }} />
            ))}
          </div>
        )}
      </div>
    ),
    size
  );
}
