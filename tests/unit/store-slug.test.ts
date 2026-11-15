import { describe, expect, it } from "vitest";
import { slugError, slugify } from "@/lib/store-slug";

describe("slugify", () => {
  it("removes accents and symbols", () => {
    expect(slugify("Boutique Élégance & Co !")).toBe("boutique-elegance-co");
    expect(slugify("  --Ma   boutique--  ")).toBe("ma-boutique");
  });

  it("limits the length to 40 characters", () => {
    expect(slugify("a".repeat(60))).toHaveLength(40);
  });
});

describe("slugError", () => {
  it("validates length, characters and reserved words", () => {
    expect(slugError("ab")).toBe("slug_short");
    expect(slugError("a".repeat(41))).toBe("slug_long");
    expect(slugError("Ma_Boutique")).toBe("slug_chars");
    expect(slugError("ma--boutique")).toBe("slug_chars");
    expect(slugError("admin")).toBe("slug_reserved");
    expect(slugError("seller")).toBe("slug_reserved");
    expect(slugError("atelier-lina")).toBeNull();
  });
});
