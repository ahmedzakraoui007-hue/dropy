import { describe, expect, it } from "vitest";
import { checkExtras, extrasFromInput, normalizeCheckout, orderNotes } from "@/lib/checkout-settings";

describe("normalizeCheckout", () => {
  it("falls back to safe defaults", () => {
    expect(normalizeCheckout(null)).toMatchObject({
      mode: "both",
      city: "optional",
      email: "hidden",
      note: "hidden",
      customFields: [],
      stickyButton: true,
      shakeButton: false,
    });
  });

  it("caps custom fields and drops empty labels", () => {
    const settings = normalizeCheckout({
      customFields: [{ label: "Taille" }, { label: "  " }, { label: "Couleur", required: true }, { label: "A" }, { label: "B" }],
    });
    expect(settings.customFields.map((f) => f.label)).toEqual(["Taille", "Couleur", "A"]);
    expect(settings.customFields[1].required).toBe(true);
  });
});

describe("checkExtras", () => {
  it("reports missing required fields and invalid emails", () => {
    const settings = normalizeCheckout({ city: "required", email: "optional", customFields: [{ id: "size", label: "Taille", required: true }] });
    expect(checkExtras(settings, extrasFromInput({ email: "pas-un-email" }))).toEqual(["city", "email_invalid", "field:size"]);
  });

  it("accepts a complete form", () => {
    const settings = normalizeCheckout({ city: "required", email: "required" });
    expect(checkExtras(settings, extrasFromInput({ city: "Sousse", email: "Client@Mail.tn" }))).toEqual([]);
  });
});

describe("extrasFromInput", () => {
  it("trims, lowercases the email and limits lengths", () => {
    const extras = extrasFromInput({ city: "  Tunis ", email: " A@B.TN ", note: "x".repeat(600) });
    expect(extras.city).toBe("Tunis");
    expect(extras.email).toBe("a@b.tn");
    expect(extras.note).toHaveLength(500);
  });
});

describe("orderNotes", () => {
  it("joins custom answers and the visible note", () => {
    const settings = normalizeCheckout({ note: "optional", customFields: [{ id: "size", label: "Taille" }] });
    expect(orderNotes(settings, extrasFromInput({ note: "Appeler apres 18h", answers: { size: "M" } }))).toBe("Taille : M\nAppeler apres 18h");
  });

  it("returns null when there is nothing to note", () => {
    expect(orderNotes(normalizeCheckout({}), extrasFromInput({ note: "cache" }))).toBeNull();
  });
});
