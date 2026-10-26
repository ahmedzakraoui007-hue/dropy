import { isApexDomain } from "@/lib/custom-domain";

const API = "https://api.vercel.com";
const PROJECT_ID = process.env.VERCEL_DOMAINS_PROJECT_ID || "prj_qDguFgK2Q4chWw40niBOKG5rTWSZ";
const TEAM_ID = process.env.VERCEL_DOMAINS_TEAM_ID || "team_HXyUffg0rq7xWuJQ42JVCZys";

type Verification = { type: string; domain: string; value: string; reason?: string };
export type DomainState = { verified: boolean; misconfigured: boolean; verification: Verification[] };

export class VercelDomainError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export function vercelDomainsEnabled() {
  return Boolean(process.env.VERCEL_API_TOKEN);
}

async function call(path: string, init: RequestInit = {}) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new VercelDomainError("not_configured", "VERCEL_API_TOKEN missing");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API}${path}${sep}teamId=${TEAM_ID}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function addProjectDomain(domain: string) {
  const main = await call(`/v10/projects/${PROJECT_ID}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  if (!main.ok && main.data?.error?.code !== "domain_already_in_use_by_project" && main.data?.error?.code !== "domain_already_exists") {
    const code = main.data?.error?.code === "domain_already_in_use" ? "taken" : "vercel_error";
    throw new VercelDomainError(code, main.data?.error?.message || "Vercel error");
  }
  if (isApexDomain(domain)) {
    await call(`/v10/projects/${PROJECT_ID}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: `www.${domain}`, redirect: domain, redirectStatusCode: 308 }),
    });
  }
}

export async function domainState(domain: string): Promise<DomainState> {
  const [project, config] = await Promise.all([
    call(`/v9/projects/${PROJECT_ID}/domains/${domain}`),
    call(`/v6/domains/${domain}/config`),
  ]);
  if (!project.ok) throw new VercelDomainError(project.status === 404 ? "not_found" : "vercel_error", project.data?.error?.message || "Vercel error");
  let verified = Boolean(project.data?.verified);
  let verification: Verification[] = project.data?.verification || [];
  if (!verified) {
    const check = await call(`/v9/projects/${PROJECT_ID}/domains/${domain}/verify`, { method: "POST" });
    if (check.ok) {
      verified = Boolean(check.data?.verified);
      verification = check.data?.verification || verification;
    }
  }
  return { verified, misconfigured: config.ok ? Boolean(config.data?.misconfigured) : true, verification };
}

export async function removeProjectDomain(domain: string) {
  await call(`/v9/projects/${PROJECT_ID}/domains/${domain}`, { method: "DELETE" });
  if (isApexDomain(domain)) await call(`/v9/projects/${PROJECT_ID}/domains/www.${domain}`, { method: "DELETE" });
}
