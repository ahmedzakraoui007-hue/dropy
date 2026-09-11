import type { Metadata, Viewport } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
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
  alternates: {
    canonical: "/",
  },
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
    images: [
      {
        url: "https://dropy.store/og-image-home.jpg",
        width: 1200,
        height: 630,
        alt: "DROPY Platform",
      },
    ],
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
    images: ["https://dropy.store/og-image.png"],
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
            <Script
              id="orchids-browser-logs"
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
              strategy="afterInteractive"
              data-orchids-project-id="4471a8c5-e525-4c97-9256-0602c8a71056"
            />
            <ErrorReporter />
            <NavbarWrapper>
              {children}
            </NavbarWrapper>
            <Toaster position="top-right" />
            <VisualEditsMessenger />
          </LanguageProvider>
        </body>
      </html>
    );
}
