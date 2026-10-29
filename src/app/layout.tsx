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
    default: "Dropy | Votre boutique en ligne gratuite en Tunisie",
    template: "%s | Dropy"
  },
  description: "L'équipe Dropy crée gratuitement la boutique en ligne de votre entreprise : vos produits, paiement à la livraison, en français et en arabe.",
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
    title: "Dropy | Votre boutique en ligne gratuite en Tunisie",
    description: "Votre boutique en ligne créée gratuitement : vos produits, paiement à la livraison, français et arabe.",
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
    title: "Dropy | Votre boutique en ligne gratuite en Tunisie",
    description: "Votre boutique en ligne créée gratuitement : vos produits, paiement à la livraison, français et arabe.",
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
