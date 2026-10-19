import { createAdminClient } from "@/lib/supabase/admin";

export const ESCROW_METHODS = {
  bank_transfer: "Virement bancaire",
  d17: "D17",
  flouci: "Flouci",
} as const;

export type EscrowMethod = keyof typeof ESCROW_METHODS;

export type EscrowState = "awaiting_payment" | "verifying" | "escrow" | "released" | "paid_out" | "refunded";

export function escrowState(payment: { status: string; escrowed_at: string | null; stripe_transfer_id: string | null } | null): EscrowState {
  if (!payment) return "awaiting_payment";
  if (payment.status === "refunded") return "refunded";
  if (payment.status === "released") return payment.stripe_transfer_id ? "paid_out" : "released";
  return payment.escrowed_at ? "escrow" : "verifying";
}

export async function platformFeePercent() {
  const admin = createAdminClient();
  const { data } = await admin.from("platform_settings").select("value").eq("key", "platform_fee_percent").maybeSingle();
  const value = Number(data?.value);
  return Number.isFinite(value) && value >= 0 && value < 100 ? value : 15;
}

export async function escrowPaymentDetails() {
  const admin = createAdminClient();
  const { data } = await admin.from("platform_settings").select("value").eq("key", "escrow_payment_details").maybeSingle();
  return typeof data?.value === "string" ? data.value : "";
}

export async function notify(userId: string | null | undefined, title: string, message: string, link: string, type = "content_update") {
  if (!userId) return;
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, type, title, message, link, is_read: false });
}

export async function notifyAdmins(title: string, message: string, link: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("role", "admin").eq("status", "approved");
  if (!data?.length) return;
  await admin.from("notifications").insert(
    data.map((a) => ({ user_id: a.id, type: "admin_action", title, message, link, is_read: false }))
  );
}

export async function loadBriefForSeller(briefId: string, userId: string) {
  const admin = createAdminClient();
  const { data: brief } = await admin.from("content_briefs").select("*").eq("id", briefId).maybeSingle();
  if (!brief) return { error: "Brief introuvable", status: 404 } as const;
  const { data: store } = await admin.from("stores").select("id, vendor_id, name").eq("id", brief.store_id).maybeSingle();
  if (store?.vendor_id !== userId) return { error: "Accès refusé", status: 403 } as const;
  return { brief, store } as const;
}
