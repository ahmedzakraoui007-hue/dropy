const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const TWO_LEVEL_SUFFIXES = new Set([
  "com.tn", "net.tn", "org.tn", "ens.tn", "fin.tn", "gov.tn", "ind.tn", "intl.tn", "nat.tn", "info.tn", "perso.tn", "tourism.tn",
  "co.uk", "com.fr", "co.ma", "com.dz",
]);

export const VERCEL_APEX_IP = "76.76.21.21";
export const VERCEL_CNAME = "cname.vercel-dns.com";

export function normalizeDomain(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
}

export function domainError(domain: string, rootDomain: string): string | null {
  if (!domain) return "required";
  if (domain.length > 253 || !DOMAIN_RE.test(domain)) return "invalid";
  const blocked = [rootDomain, "dropy.store", "vercel.app", "localhost"].filter(Boolean);
  if (blocked.some((root) => domain === root || domain.endsWith(`.${root}`))) return "platform";
  return null;
}

export function isApexDomain(domain: string) {
  const labels = domain.split(".");
  if (labels.length <= 2) return true;
  return labels.length === 3 && TWO_LEVEL_SUFFIXES.has(labels.slice(1).join("."));
}

export type DnsRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string };

export function dnsRecordsFor(domain: string, verification: { type: string; domain: string; value: string }[] = []): DnsRecord[] {
  const records: DnsRecord[] = [];
  if (isApexDomain(domain)) {
    records.push({ type: "A", name: "@", value: VERCEL_APEX_IP });
    records.push({ type: "CNAME", name: "www", value: VERCEL_CNAME });
  } else {
    records.push({ type: "CNAME", name: domain.split(".")[0], value: VERCEL_CNAME });
  }
  for (const v of verification) {
    if (v.type?.toUpperCase() === "TXT") {
      const name = v.domain.endsWith(`.${domain}`) ? v.domain.slice(0, -(domain.length + 1)) : v.domain;
      records.push({ type: "TXT", name, value: v.value });
    }
  }
  return records;
}
