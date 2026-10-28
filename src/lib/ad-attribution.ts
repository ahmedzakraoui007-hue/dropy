export type AdPlatform = "facebook" | "tiktok" | "google" | "snapchat" | "instagram_bio" | "other" | "direct" | "manual";

export type Attribution = {
  platform: AdPlatform;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  adset: string | null;
  ad: string | null;
  term: string | null;
  clickId: boolean;
  referrer: string | null;
  landing: string | null;
  capturedAt: string;
};

const STORAGE_PREFIX = "dropy_attr_";
const MAX_AGE_MS = 30 * 24 * 3600 * 1000;

const clean = (value: unknown, max = 120) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return text || null;
};

function platformFrom(source: string | null, referrer: string | null, clicks: { fb: boolean; tt: boolean; g: boolean; sc: boolean }): AdPlatform {
  const s = (source || "").toLowerCase();
  if (clicks.fb || /^(facebook|fb|meta|instagram|ig)/.test(s)) return "facebook";
  if (clicks.tt || s.startsWith("tiktok")) return "tiktok";
  if (clicks.g || s.startsWith("google")) return "google";
  if (clicks.sc || s.startsWith("snap")) return "snapchat";
  if (s) return "other";
  const host = (referrer || "").toLowerCase();
  if (/facebook\.com|fb\.com|instagram\.com|messenger\.com/.test(host)) return "facebook";
  if (/tiktok\.com/.test(host)) return "tiktok";
  if (/google\./.test(host)) return "google";
  if (/snapchat\.com/.test(host)) return "snapchat";
  if (host) return "other";
  return "direct";
}

export function attributionFromUrl(url: URL, referrer: string | null): Attribution | null {
  const p = url.searchParams;
  const clicks = { fb: p.has("fbclid"), tt: p.has("ttclid"), g: p.has("gclid") || p.has("gbraid") || p.has("wbraid"), sc: p.has("ScCid") || p.has("sccid") };
  const source = clean(p.get("utm_source"));
  const hasParams = Boolean(source || p.get("utm_campaign") || clicks.fb || clicks.tt || clicks.g || clicks.sc);
  let refHost: string | null = null;
  try {
    refHost = referrer ? new URL(referrer).hostname : null;
  } catch {
    refHost = null;
  }
  if (refHost && refHost === url.hostname) refHost = null;
  if (!hasParams && !refHost) return null;
  return {
    platform: platformFrom(source, refHost, clicks),
    source,
    medium: clean(p.get("utm_medium")),
    campaign: clean(p.get("utm_campaign")),
    adset: clean(p.get("utm_adset") || p.get("utm_term")),
    ad: clean(p.get("utm_content")),
    term: clean(p.get("utm_term")),
    clickId: clicks.fb || clicks.tt || clicks.g || clicks.sc,
    referrer: refHost,
    landing: clean(url.pathname, 200),
    capturedAt: new Date().toISOString(),
  };
}

export function captureAttribution(storeId: string) {
  if (typeof window === "undefined" || window.parent !== window) return;
  try {
    const found = attributionFromUrl(new URL(window.location.href), document.referrer || null);
    const key = STORAGE_PREFIX + storeId;
    if (found && (found.platform !== "other" || found.source || !localStorage.getItem(key))) {
      localStorage.setItem(key, JSON.stringify(found));
    }
  } catch {
    return;
  }
}

export function storedAttribution(storeId: string | null | undefined): Attribution | null {
  if (!storeId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + storeId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed?.capturedAt || Date.now() - new Date(parsed.capturedAt).getTime() > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

const PLATFORMS = new Set<AdPlatform>(["facebook", "tiktok", "google", "snapchat", "instagram_bio", "other", "direct", "manual"]);

export function sanitizeAttribution(raw: unknown): Attribution {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const platform = PLATFORMS.has(data.platform as AdPlatform) && data.platform !== "manual" ? (data.platform as AdPlatform) : "direct";
  const captured = new Date(String(data.capturedAt || ""));
  return {
    platform,
    source: clean(data.source),
    medium: clean(data.medium),
    campaign: clean(data.campaign),
    adset: clean(data.adset),
    ad: clean(data.ad),
    term: clean(data.term),
    clickId: data.clickId === true,
    referrer: clean(data.referrer),
    landing: clean(data.landing, 200),
    capturedAt: Number.isFinite(captured.getTime()) ? captured.toISOString() : new Date().toISOString(),
  };
}

export const FACEBOOK_URL_PARAMS = "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_adset={{adset.name}}&utm_content={{ad.name}}";
export const TIKTOK_URL_PARAMS = "utm_source=tiktok&utm_medium=paid&utm_campaign=__CAMPAIGN_NAME__&utm_adset=__AID_NAME__&utm_content=__CID_NAME__";
