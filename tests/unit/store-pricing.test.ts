import { describe, expect, it } from "vitest";
import { deliveryFeeFor, discountedUnitPrice, normalizeOffers, offerPercentFor, roundMoney } from "@/lib/store-pricing";

describe("normalizeOffers", () => {
  it("keeps valid offers sorted and capped at three", () => {
    const offers = normalizeOffers([
      { min_quantity: 5, discount_percent: 20 },
      { min_quantity: 2, discount_percent: 10 },
      { min_quantity: 3, discount_percent: 15 },
      { min_quantity: 4, discount_percent: 18 },
    ]);
    expect(offers.map((o) => o.min_quantity)).toEqual([2, 3, 4]);
  });

  it("drops offers outside the allowed ranges", () => {
    expect(
      normalizeOffers([
        { min_quantity: 1, discount_percent: 10 },
        { min_quantity: 11, discount_percent: 10 },
        { min_quantity: 2, discount_percent: 0 },
        { min_quantity: 2, discount_percent: 60 },
        { min_quantity: "x", discount_percent: 10 },
      ])
    ).toEqual([]);
  });

  it("returns nothing for non-array input", () => {
    expect(normalizeOffers(null)).toEqual([]);
    expect(normalizeOffers({ min_quantity: 2 })).toEqual([]);
  });

  it("keeps the last value for a repeated quantity", () => {
    expect(normalizeOffers([{ min_quantity: 2, discount_percent: 10 }, { min_quantity: 2, discount_percent: 12 }])).toEqual([
      { min_quantity: 2, discount_percent: 12 },
    ]);
  });
});

describe("quantity discounts", () => {
  const offers = normalizeOffers([
    { min_quantity: 2, discount_percent: 10 },
    { min_quantity: 3, discount_percent: 15 },
  ]);

  it("applies the best reached tier", () => {
    expect(offerPercentFor(1, offers)).toBe(0);
    expect(offerPercentFor(2, offers)).toBe(10);
    expect(offerPercentFor(7, offers)).toBe(15);
  });

  it("rounds discounted prices", () => {
    expect(discountedUnitPrice(219, 2, offers)).toBe(197.1);
    expect(discountedUnitPrice(99.99, 3, offers)).toBe(roundMoney(99.99 * 0.85));
    expect(discountedUnitPrice(50, 1, offers)).toBe(50);
  });
});

describe("deliveryFeeFor", () => {
  it("charges the store fee below the free threshold", () => {
    expect(deliveryFeeFor(80, { delivery_fee: 7, free_delivery_threshold: 100 })).toBe(7);
  });

  it("is free at or above the threshold", () => {
    expect(deliveryFeeFor(100, { delivery_fee: 7, free_delivery_threshold: 100 })).toBe(0);
  });

  it("ignores empty or invalid settings", () => {
    expect(deliveryFeeFor(50, { delivery_fee: "8", free_delivery_threshold: null })).toBe(8);
    expect(deliveryFeeFor(50, { delivery_fee: -3 })).toBe(0);
    expect(deliveryFeeFor(50, {})).toBe(0);
  });
});
