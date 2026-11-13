import { createHmac, timingSafeEqual } from "node:crypto";

const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

function secret() {
  return process.env.SIGNUP_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(`signup:${value}`).digest("base64url");
}

export function issueFormToken() {
  const issued = String(Date.now());
  return `${issued}.${sign(issued)}`;
}

export function formTokenValid(token: unknown) {
  if (typeof token !== "string" || !secret()) return false;
  const [issued, signature] = token.split(".");
  if (!issued || !signature) return false;
  const expected = Buffer.from(sign(issued));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  const age = Date.now() - Number(issued);
  return age >= MIN_AGE_MS && age <= MAX_AGE_MS;
}

export async function captchaValid(token: unknown, ip: string | null) {
  const key = process.env.TURNSTILE_SECRET_KEY;
  if (!key) return true;
  if (typeof token !== "string" || !token) return false;
  const body = new URLSearchParams({ secret: key, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }).catch(() => null);
  const result = response ? await response.json().catch(() => null) : null;
  return result?.success === true;
}

const CREATOR_SPECIALTIES = ["video", "photo", "lifestyle", "unboxing"];

export function missingRoleFields(role: string, data: Record<string, unknown>) {
  const text = (key: string) => String(data[key] ?? "").trim();
  if (role === "creator") {
    return !CREATOR_SPECIALTIES.includes(text("specialty")) || !text("instagram") || !/^https?:\/\/\S+\.\S+/.test(text("portfolio"));
  }
  if (role === "supplier") return !text("companyName") || !text("taxId") || !text("productType");
  return false;
}
