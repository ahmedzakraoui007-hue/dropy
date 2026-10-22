export type QuantityOffer = { min_quantity: number; discount_percent: number };

type DeliverySettings = { delivery_fee?: number | string | null; free_delivery_threshold?: number | string | null };

export const MAX_OFFERS = 3;

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeOffers(raw: unknown): QuantityOffer[] {
  if (!Array.isArray(raw)) return [];
  const byQuantity = new Map<number, number>();
  for (const item of raw) {
    const min = Math.floor(Number((item as any)?.min_quantity));
    const pct = Number((item as any)?.discount_percent);
    if (!Number.isFinite(min) || !Number.isFinite(pct) || min < 2 || min > 10 || pct <= 0 || pct > 50) continue;
    byQuantity.set(min, Math.round(pct * 10) / 10);
  }
  return [...byQuantity.entries()]
    .map(([min_quantity, discount_percent]) => ({ min_quantity, discount_percent }))
    .sort((a, b) => a.min_quantity - b.min_quantity)
    .slice(0, MAX_OFFERS);
}

export function offerPercentFor(quantity: number, offers: QuantityOffer[]) {
  let percent = 0;
  for (const offer of offers) if (quantity >= offer.min_quantity) percent = Math.max(percent, offer.discount_percent);
  return percent;
}

export function discountedUnitPrice(unitPrice: number, quantity: number, offers: QuantityOffer[]) {
  return roundMoney(unitPrice * (1 - offerPercentFor(quantity, offers) / 100));
}

export function deliveryFeeFor(merchandiseTotal: number, settings: DeliverySettings) {
  const fee = Math.max(0, Number(settings.delivery_fee) || 0);
  const threshold = Number(settings.free_delivery_threshold);
  if (fee === 0) return 0;
  if (Number.isFinite(threshold) && threshold > 0 && merchandiseTotal >= threshold) return 0;
  return roundMoney(fee);
}
