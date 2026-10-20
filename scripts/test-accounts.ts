import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

type Role = "admin" | "seller" | "supplier" | "creator";

const ACCOUNTS: { email: string; role: Role; fullName: string }[] = [
  { email: "admin@dropy.store", role: "admin", fullName: "Admin Dropy" },
  { email: "seller.test@dropy.store", role: "seller", fullName: "Vendeur Test" },
  { email: "supplier.test@dropy.store", role: "supplier", fullName: "Fournisseur Test" },
  { email: "creator.test@dropy.store", role: "creator", fullName: "Créateur Test" },
];

const EXPOSED_ACCOUNTS = [
  "admin.test@dropy.store",
  "test-admin-orchids@gmail.com",
  "seller@dropy.store",
  "supplier@dropy.store",
  "creator@dropy.store",
  "test-seller@dropy.tn",
  "test-supplier@dropy.tn",
  "test-creator@dropy.tn",
  "test-admin@dropy.tn",
];

const OUTPUT_FILE = "test-accounts.local.txt";

function newPassword() {
  return `${randomBytes(12).toString("base64url")}#9a`;
}

async function findUserId(supabase: SupabaseClient, email: string) {
  const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (data?.id) return data.id as string;

  for (let page = 1; page <= 50; page++) {
    const { data: list, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = list.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (list.users.length < 200) break;
  }
  return null;
}

async function upsertRoleProfile(supabase: SupabaseClient, table: string, row: Record<string, unknown>) {
  const { data: existing } = await supabase.from(table).select("user_id").eq("user_id", row.user_id).maybeSingle();
  const { error } = existing
    ? await supabase.from(table).update(row).eq("user_id", row.user_id)
    : await supabase.from(table).insert(row);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function issueAccount(supabase: SupabaseClient, account: (typeof ACCOUNTS)[number]) {
  const password = newPassword();
  let userId = await findUserId(supabase, account.email);

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      ban_duration: "none",
      user_metadata: { full_name: account.fullName, role: account.role },
    });
    if (error) throw new Error(`${account.email}: ${error.message}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName, role: account.role === "admin" ? "seller" : account.role },
    });
    if (error || !data.user) throw new Error(`${account.email}: ${error?.message || "creation failed"}`);
    userId = data.user.id;
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: userId, email: account.email, full_name: account.fullName, role: account.role, status: "pending" });
  if (upsertError) throw new Error(`profiles: ${upsertError.message}`);

  if (account.role === "supplier") {
    await upsertRoleProfile(supabase, "supplier_profiles", {
      user_id: userId,
      company_name: "Fournisseur Test SARL",
      status: "approved",
    });
  }
  if (account.role === "creator") {
    await upsertRoleProfile(supabase, "creator_profiles", { user_id: userId, status: "approved" });
  }

  const { error: approveError } = await supabase
    .from("profiles")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (approveError) throw new Error(`approve ${account.email}: ${approveError.message}`);

  return { ...account, password };
}

async function lockExposedAccount(supabase: SupabaseClient, email: string) {
  const userId = await findUserId(supabase, email);
  if (!userId) return "absent";
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword(),
    ban_duration: "876000h",
  });
  if (error) return `erreur: ${error.message}`;
  await supabase.from("profiles").update({ status: "suspended" }).eq("id", userId);
  return "verrouillé";
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être dans .env.local");
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const issued = [];
  for (const account of ACCOUNTS) {
    issued.push(await issueAccount(supabase, account));
    console.log(`✓ ${account.role.padEnd(8)} ${account.email}`);
  }

  console.log("\nComptes exposés dans l'historique Git :");
  for (const email of EXPOSED_ACCOUNTS) {
    console.log(`  ${email}: ${await lockExposedAccount(supabase, email)}`);
  }

  const lines = [
    `Comptes Dropy — générés le ${new Date().toISOString()}`,
    "Ne jamais committer ce fichier. Relancer le script pour changer les mots de passe.",
    "",
    ...issued.map((a) => `${a.role.padEnd(9)} ${a.email}  ${a.password}`),
    "",
  ];
  writeFileSync(OUTPUT_FILE, lines.join("\n"), { mode: 0o600 });
  console.log(`\nIdentifiants écrits dans ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
