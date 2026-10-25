export type OrderProtection = {
  maxQuantity: number | null;
  maxAmount: number | null;
  blockDesktop: boolean;
};

export const RISK_FLAGS = ["repeat_phone", "previous_fake", "ip_burst"] as const;
export type RiskFlag = (typeof RISK_FLAGS)[number];

const positive = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function normalizeProtection(raw: unknown): OrderProtection {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const maxQuantity = positive(data.maxQuantity);
  return {
    maxQuantity: maxQuantity ? Math.min(100, Math.floor(maxQuantity)) : null,
    maxAmount: positive(data.maxAmount),
    blockDesktop: data.blockDesktop === true,
  };
}

export function phoneKey(phone: unknown) {
  return String(phone ?? "").replace(/\D/g, "").replace(/^216/, "");
}

export function isMobileUserAgent(userAgent: string) {
  return /android|iphone|ipad|ipod|mobile|windows phone|opera mini|iemobile/i.test(userAgent);
}

export function requestIp(request: Request) {
  const header =
    request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  const ip = header.split(",")[0].trim();
  return /^[0-9a-f:.]{3,64}$/i.test(ip) ? ip : null;
}

export async function verifyTurnstile(token: unknown, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
