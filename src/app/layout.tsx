import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DropyAnalytics } from "@/components/analytics/DropyAnalytics";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/context/LanguageContext";

export const viewport: Viewport = {
  themeColor: "#00B4A2",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dropy.store"),
  title: {
    default: "Dropy | Boutique en ligne sans stock en Tunisie",
    template: "%s | Dropy"
  },
  description: "Créez votre boutique en ligne gratuitement, vendez les produits de fournisseurs tunisiens avec paiement à la livraison et travaillez avec des créateurs UGC.",
  keywords: ["e-commerce tunisie", "boutique en ligne tunisie", "dropshipping tunisie", "paiement à la livraison", "fournisseur textile tunisie", "créateurs UGC"],
  authors: [{ name: "Dropy Team" }],
  creator: "Dropy",
  publisher: "Dropy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_TN",
    url: "https://dropy.store",
    siteName: "Dropy",
    title: "Dropy | Boutique en ligne sans stock en Tunisie",
    description: "Créez votre boutique, vendez les produits de fournisseurs tunisiens et encaissez à la livraison. Gratuit pendant le lancement.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  twitter: {
    card: "summary_large_image",
    title: "Dropy | Boutique en ligne sans stock en Tunisie",
    description: "Créez votre boutique, vendez les produits de fournisseurs tunisiens et encaissez à la livraison. Gratuit pendant le lancement.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
      <html lang="fr" suppressHydrationWarning>
        <body className="antialiased" suppressHydrationWarning>
          <LanguageProvider>
            <DropyAnalytics />
            {children}
            <Toaster position="top-right" />
          </LanguageProvider>
        </body>
      </html>
    );
}
