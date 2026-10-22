import { ImageResponse } from "next/og";

export const alt = "DROPY - Lancez votre e-commerce en Tunisie";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #2E3192 0%, #6D28D9 55%, #00A99D 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "22px",
              background: "white",
              color: "#2E3192",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "56px",
              fontWeight: 900,
            }}
          >
            D
          </div>
          <div style={{ fontSize: "56px", fontWeight: 900, letterSpacing: "-1px" }}>DROPY</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: "72px", fontWeight: 900, lineHeight: 1.05, maxWidth: "980px" }}>
            Lancez votre boutique en ligne en Tunisie
          </div>
          <div style={{ fontSize: "34px", opacity: 0.9 }}>
            Sans stock · Paiement à la livraison · Livraison partout en Tunisie
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "30px" }}>
          <div style={{ background: "white", color: "#2E3192", borderRadius: "999px", padding: "12px 28px", fontWeight: 800 }}>
            100 % gratuit pendant le lancement
          </div>
          <div style={{ opacity: 0.9 }}>dropy.store</div>
        </div>
      </div>
    ),
    size
  );
}
