import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/context/LanguageContext";

export const viewport: Viewport = {
  themeColor: "#00B4A2",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dropy.store"),
  title: {
    default: "DROPY - Lancez votre e-commerce en 30 minutes",
    template: "%s | DROPY"
  },
  description: "Plateforme SaaS e-commerce tout-en-un pour le marché tunisien. Website Builder, Marketplace produits, et Créateurs de contenu.",
  keywords: ["e-commerce", "tunisie", "dropshipping", "SaaS", "website builder", "créateurs de contenu"],
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
    siteName: "DROPY",
    title: "DROPY - Lancez votre e-commerce en 30 minutes",
    description: "La plateforme e-commerce #1 en Tunisie pour lancer votre business en ligne sans stock.",
  },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" },
      ],
    },
  manifest: "/site.webmanifest",
  twitter: {
    card: "summary_large_image",
    title: "DROPY - Lancez votre e-commerce en 30 minutes",
    description: "La plateforme e-commerce #1 en Tunisie pour lancer votre business en ligne sans stock.",
    creator: "@dropy_store",
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
            <Script
              id="gtag-base"
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-E670RXNKLL"
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-E670RXNKLL');
              `}
            </Script>
            {children}
            <Toaster position="top-right" />
          </LanguageProvider>
        </body>
      </html>
    );
}
