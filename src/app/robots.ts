import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE_URL, isPlatformHost, storeSlugFromHost, storeUrl } from "@/lib/store-url";
import { customDomainForSlug, storeSlugForHost } from "@/lib/custom-domain-lookup";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  const storeSlug = await storeSlugForHost(host, storeSlugFromHost, isPlatformHost);

  if (storeSlug) {
    return {
      rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/checkout", "/merci/", "/track"] },
      sitemap: storeUrl(storeSlug, "/sitemap.xml", await customDomainForSlug(storeSlug)),
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/seller/",
        "/supplier/",
        "/creator/",
        "/api/",
        "/auth/",
        "/preview/",
        "/login",
        "/inscription",
        "/register",
        "/forgot-password",
        "/demande-en-attente",
        "/*/checkout",
        "/*/merci/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
