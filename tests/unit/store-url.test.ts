import { afterEach, describe, expect, it, vi } from "vitest";

async function load(rootDomain: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_STORE_ROOT_DOMAIN", rootDomain);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dropy.store");
  return import("@/lib/store-url");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("store URLs", () => {
  it("reads the store slug from a subdomain", async () => {
    const { storeSlugFromHost } = await load("dropy.store");
    expect(storeSlugFromHost("atelier-lina.dropy.store")).toBe("atelier-lina");
    expect(storeSlugFromHost("atelier-lina.dropy.store:443")).toBe("atelier-lina");
    expect(storeSlugFromHost("www.dropy.store")).toBeNull();
    expect(storeSlugFromHost("admin.dropy.store")).toBeNull();
    expect(storeSlugFromHost("a.b.dropy.store")).toBeNull();
    expect(storeSlugFromHost("evil-dropy.store")).toBeNull();
  });

  it("builds subdomain, path and custom domain links", async () => {
    const withRoot = await load("dropy.store");
    expect(withRoot.storeUrl("lina", "/p/1")).toBe("https://lina.dropy.store/p/1");
    expect(withRoot.storeUrl("lina", "p/1", "lina.tn")).toBe("https://lina.tn/p/1");
    const withoutRoot = await load("");
    expect(withoutRoot.storeUrl("lina", "/contact")).toBe("https://dropy.store/lina/contact");
  });

  it("separates platform hosts from customer domains", async () => {
    const { isPlatformHost } = await load("dropy.store");
    expect(isPlatformHost("dropy.store")).toBe(true);
    expect(isPlatformHost("lina.dropy.store")).toBe(true);
    expect(isPlatformHost("dropy-git-x.vercel.app")).toBe(true);
    expect(isPlatformHost("localhost:3000")).toBe(true);
    expect(isPlatformHost("boutique-lina.tn")).toBe(false);
  });
});

describe("product paths", () => {
  it("prefers the slug and encodes it", async () => {
    const { productPath, isUuid } = await load("dropy.store");
    const id = "f403d037-94ca-4180-8ddf-830d79ff0299";
    expect(isUuid(id)).toBe(true);
    expect(isUuid("manteau-long-bleu-ciel")).toBe(false);
    expect(productPath({ id, slug: "manteau-long-bleu-ciel" })).toBe("/p/manteau-long-bleu-ciel");
    expect(productPath({ id, slug: null })).toBe(`/p/${id}`);
    expect(productPath({ id, slug: "فستان-صيفي" })).toBe(`/p/${encodeURIComponent("فستان-صيفي")}`);
  });
});
