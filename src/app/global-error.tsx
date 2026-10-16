"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>Une erreur est survenue</h1>
            <p style={{ color: "#64748b", margin: "0 0 4px" }}>Le site n&apos;a pas pu s&apos;afficher. Réessayez dans un instant.</p>
            <p style={{ color: "#64748b", margin: "0 0 20px" }} dir="rtl">حدث خطأ. يرجى المحاولة مرة أخرى.</p>
            <button
              onClick={reset}
              style={{ height: 44, padding: "0 20px", borderRadius: 12, border: 0, background: "#2E3192", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Réessayer
            </button>
            {error.digest && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16 }}>Réf. {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  );
}
