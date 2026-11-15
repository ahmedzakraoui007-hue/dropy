import { describe, expect, it } from "vitest";
import { isMobileUserAgent, normalizeProtection, phoneKey, requestIp } from "@/lib/order-protection";

describe("phoneKey", () => {
  it("keeps the 8 local digits", () => {
    expect(phoneKey("+216 22 345 678")).toBe("22345678");
    expect(phoneKey("21622345678")).toBe("22345678");
    expect(phoneKey("22-345-678")).toBe("22345678");
    expect(phoneKey(null)).toBe("");
  });
});

describe("normalizeProtection", () => {
  it("ignores invalid limits", () => {
    expect(normalizeProtection({ maxQuantity: "abc", maxAmount: -5, blockDesktop: "yes" })).toEqual({ maxQuantity: null, maxAmount: null, blockDesktop: false });
  });

  it("caps the quantity limit", () => {
    expect(normalizeProtection({ maxQuantity: 500.7, maxAmount: "300", blockDesktop: true })).toEqual({ maxQuantity: 100, maxAmount: 300, blockDesktop: true });
  });
});

describe("isMobileUserAgent", () => {
  it("detects phones and rejects desktops", () => {
    expect(isMobileUserAgent("Mozilla/5.0 (Linux; Android 14; SM-A546B) Mobile Safari/537.36")).toBe(true);
    expect(isMobileUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(isMobileUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0")).toBe(false);
  });
});

describe("requestIp", () => {
  const req = (headers: Record<string, string>) => new Request("https://x.test", { headers });

  it("takes the first forwarded address", () => {
    expect(requestIp(req({ "x-forwarded-for": "41.226.1.2, 10.0.0.1" }))).toBe("41.226.1.2");
  });

  it("rejects malformed values", () => {
    expect(requestIp(req({ "x-forwarded-for": "<script>" }))).toBeNull();
    expect(requestIp(req({}))).toBeNull();
  });
});
