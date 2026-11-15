import type { SupabaseClient } from "@supabase/supabase-js";

type PushMessage = { title: string; body: string; data?: Record<string, unknown> };

export async function sendPushToUser(admin: SupabaseClient, userId: string, message: PushMessage) {
  try {
    const { data: rows } = await admin.from("push_tokens").select("token").eq("user_id", userId);
    const tokens = (rows || []).map((r) => r.token as string).filter((t) => t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["));
    if (!tokens.length) return;
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(tokens.map((to) => ({ to, sound: "cash.wav", priority: "high", channelId: "orders_cash", ...message }))),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json().catch(() => null);
    const dead = ((result?.data || []) as any[])
      .map((ticket, index) => (ticket?.details?.error === "DeviceNotRegistered" ? tokens[index] : null))
      .filter(Boolean) as string[];
    if (dead.length) await admin.from("push_tokens").delete().in("token", dead);
  } catch {
  }
}
