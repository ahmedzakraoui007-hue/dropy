import { describe, expect, it } from "vitest";
import { plainText, productInStock } from "@/lib/store-metadata";

describe("productInStock", () => {
  it("reads the product stock when there are no variants", () => {
    expect(productInStock({ stock_quantity: 3 })).toBe(true);
    expect(productInStock({ stock_quantity: 0 })).toBe(false);
    expect(productInStock({ stock_quantity: null })).toBe(true);
  });

  it("reads variant stock when the product has variants", () => {
    expect(productInStock({ stock_quantity: 0, has_variants: true, variants: [{ stock: 0 }, { stock: 2 }] })).toBe(true);
    expect(productInStock({ stock_quantity: 5, has_variants: true, variants: [{ stock: 0 }, { stock: 0 }] })).toBe(false);
    expect(productInStock({ stock_quantity: 0, has_variants: true, variants: [{ stock: null }] })).toBe(true);
  });
});

describe("plainText", () => {
  it("strips tags and truncates", () => {
    expect(plainText("<p>Robe <b>longue</b></p>")).toBe("Robe longue");
    expect(plainText("a".repeat(300), 20).length).toBeLessThanOrEqual(21);
  });
});
