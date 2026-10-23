type MessageItem = { product_name?: string | null; quantity?: number | null; variant_info?: Record<string, unknown> | null };

export type MessageOrder = {
  order_number?: string | null;
  customer_name?: string | null;
  customer_address?: string | null;
  customer_governorate?: string | null;
  customer_city?: string | null;
  customer_delegation?: string | null;
  total_amount?: number | string | null;
  items?: MessageItem[] | null;
};

type Lang = "fr" | "ar";

const money = (value: unknown, lang: Lang) => {
  const amount = (Number(value) || 0).toFixed(3).replace(".", ",");
  return lang === "ar" ? `${amount} د.ت` : `${amount} DT`;
};

const itemsLine = (items: MessageItem[] | null | undefined) =>
  (items || [])
    .map((item) => {
      const variant = item.variant_info ? Object.values(item.variant_info).filter(Boolean).join(" / ") : "";
      return `${item.quantity || 1} × ${item.product_name || ""}${variant ? ` (${variant})` : ""}`;
    })
    .join(", ");

const addressLine = (order: MessageOrder) =>
  [order.customer_address, order.customer_city || order.customer_delegation, order.customer_governorate].filter(Boolean).join(", ");

export function phoneForWhatsApp(phone: string | null | undefined) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 8) return `216${digits}`;
  return digits;
}

export function sellerConfirmationMessage(order: MessageOrder, storeName: string, lang: Lang) {
  const name = order.customer_name?.trim() || "";
  if (lang === "ar") {
    return [
      `مرحبًا ${name}، معك متجر ${storeName}.`,
      `استلمنا طلبك ${order.order_number || ""}: ${itemsLine(order.items)}.`,
      `المبلغ: ${money(order.total_amount, lang)} (مع التوصيل)، الدفع عند الاستلام.`,
      addressLine(order) ? `العنوان: ${addressLine(order)}.` : "",
      "هل تؤكد الطلب؟ أجب بـ «نعم». شكرًا!",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Bonjour ${name}, ici la boutique ${storeName}.`,
    `Nous avons bien reçu votre commande ${order.order_number || ""} : ${itemsLine(order.items)}.`,
    `Total : ${money(order.total_amount, lang)} livraison comprise, à payer à la livraison.`,
    addressLine(order) ? `Adresse : ${addressLine(order)}.` : "",
    "Pouvez-vous confirmer en répondant « OUI » ? Merci !",
  ]
    .filter(Boolean)
    .join("\n");
}

export function customerConfirmationMessage(order: MessageOrder, lang: Lang) {
  if (lang === "ar") {
    return [
      `مرحبًا، أؤكد طلبي ${order.order_number || ""}: ${itemsLine(order.items)}.`,
      `المبلغ: ${money(order.total_amount, lang)}.`,
      order.customer_name ? `الاسم: ${order.customer_name}` : "",
      addressLine(order) ? `العنوان: ${addressLine(order)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Bonjour, je confirme ma commande ${order.order_number || ""} : ${itemsLine(order.items)}.`,
    `Total : ${money(order.total_amount, lang)}.`,
    order.customer_name ? `Nom : ${order.customer_name}` : "",
    addressLine(order) ? `Adresse : ${addressLine(order)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function whatsappLink(phone: string | null | undefined, text: string) {
  return `https://wa.me/${phoneForWhatsApp(phone)}?text=${encodeURIComponent(text)}`;
}
