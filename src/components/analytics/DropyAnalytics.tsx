"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { RESERVED_SLUGS } from "@/lib/store-slug";
import { storeSlugFromHost } from "@/lib/store-url";

const GA_ID = "G-E670RXNKLL";

export function DropyAnalytics() {
  const pathname = usePathname() || "/";
  if (typeof window !== "undefined" && storeSlugFromHost(window.location.host)) return null;
  const first = pathname.split("/")[1] || "";
  if (first === "preview" || (first && !RESERVED_SLUGS.has(first))) return null;

  return (
    <>
      <Script id="gtag-base" async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
