import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORE_ROOT_DOMAIN } from "@/lib/store-url";
import { dnsRecordsFor, domainError, normalizeDomain } from "@/lib/custom-domain";
import { VercelDomainError, addProjectDomain, domainState, removeProjectDomain, vercelDomainsEnabled } from "@/lib/vercel-domains";

type StoreRow = { id: string; custom_domain: string | null; custom_domain_status: string };

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

async function ownStore(): Promise<{ store: StoreRow } | { response: NextResponse }> {
  const auth = await requireUser(["seller", "admin"]);
  if (!auth.ok) return { response: auth.response };
  const { data: store } = await auth.supabase
    .from("stores")
    .select("id, custom_domain, custom_domain_status")
    .eq("vendor_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return { response: json({ error: "store_not_found" }, 404) };
  return { store: store as StoreRow };
}

async function describe(store: StoreRow) {
  if (!store.custom_domain) return { enabled: vercelDomainsEnabled(), domain: null, status: "none", records: [] };
  const state = await domainState(store.custom_domain).catch(() => null);
  const active = Boolean(state?.verified && !state.misconfigured);
  const status = active ? "active" : "pending";
  if (status !== store.custom_domain_status || state) {
    await createAdminClient()
      .from("stores")
      .update({ custom_domain_status: status, custom_domain_checked_at: new Date().toISOString() })
      .eq("id", store.id);
  }
  return {
    enabled: vercelDomainsEnabled(),
    domain: store.custom_domain,
    status,
    records: dnsRecordsFor(store.custom_domain, state?.verification || []),
    misconfigured: state?.misconfigured ?? true,
    verified: state?.verified ?? false,
  };
}

export async function GET() {
  const owner = await ownStore();
  if ("response" in owner) return owner.response;
  if (!vercelDomainsEnabled()) return json({ enabled: false, domain: owner.store.custom_domain, status: owner.store.custom_domain_status, records: [] });
  return json(await describe(owner.store));
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "custom-domain", 10, 3600);
  if (limited) return limited;
  const owner = await ownStore();
  if ("response" in owner) return owner.response;
  if (!vercelDomainsEnabled()) return json({ error: "not_configured" }, 503);
  if (owner.store.custom_domain) return json({ error: "already_set" }, 409);

  const body = await request.json().catch(() => ({}));
  const domain = normalizeDomain(body?.domain);
  const problem = domainError(domain, STORE_ROOT_DOMAIN);
  if (problem) return json({ error: problem }, 400);

  const admin = createAdminClient();
  const { data: taken } = await admin.from("stores").select("id").eq("custom_domain", domain).neq("id", owner.store.id).maybeSingle();
  if (taken) return json({ error: "taken" }, 409);

  try {
    await addProjectDomain(domain);
  } catch (error) {
    const code = error instanceof VercelDomainError ? error.code : "vercel_error";
    return json({ error: code }, code === "taken" ? 409 : 502);
  }
  const { error } = await admin
    .from("stores")
    .update({ custom_domain: domain, custom_domain_status: "pending", custom_domain_checked_at: new Date().toISOString() })
    .eq("id", owner.store.id);
  if (error) {
    await removeProjectDomain(domain).catch(() => {});
    return json({ error: "save_failed" }, 500);
  }
  return json(await describe({ ...owner.store, custom_domain: domain, custom_domain_status: "pending" }));
}

export async function DELETE() {
  const owner = await ownStore();
  if ("response" in owner) return owner.response;
  const domain = owner.store.custom_domain;
  if (!domain) return json({ enabled: vercelDomainsEnabled(), domain: null, status: "none", records: [] });
  if (vercelDomainsEnabled()) await removeProjectDomain(domain).catch(() => {});
  await createAdminClient()
    .from("stores")
    .update({ custom_domain: null, custom_domain_status: "none", custom_domain_checked_at: null })
    .eq("id", owner.store.id);
  return json({ enabled: vercelDomainsEnabled(), domain: null, status: "none", records: [] });
}
