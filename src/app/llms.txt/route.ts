import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL, isPlatformHost, storeSlugFromHost, storeUrl } from "@/lib/store-url";
import { storeSlugForHost } from "@/lib/custom-domain-lookup";
import { publishedPosts } from "@/lib/blog";
import { plainText, productInStock } from "@/lib/store-metadata";

export const dynamic = "force-dynamic";

function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

const money = (value: unknown) => `${Number(value || 0).toFixed(3)} DT`;
const line = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

function text(body: string) {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}

async function storeLlms(slug: string) {
  const supabase = anonClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, description, seo_description, custom_domain, custom_domain_status, delivery_fee, free_delivery_threshold, whatsapp_number, contact_email, storefront_language")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!store) return text("# Boutique introuvable\n");

  const domain = store.custom_domain_status === "active" ? store.custom_domain : null;
  const url = (path = "") => storeUrl(store.slug, path, domain);
  const [{ data: products }, { data: pages }] = await Promise.all([
    supabase
      .from("store_products")
      .select("id, name, description, selling_price, compare_at_price, stock_quantity, has_variants, variants")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("position", { ascending: true, nullsFirst: false })
      .limit(300),
    supabase.from("store_pages").select("slug, title, is_homepage").eq("store_id", store.id).eq("is_published", true),
  ]);

  const fee = Number(store.delivery_fee) || 0;
  const threshold = Number(store.free_delivery_threshold) || 0;
  const delivery = fee === 0 ? "Livraison gratuite partout en Tunisie." : `Livraison partout en Tunisie : ${money(fee)}${threshold > 0 ? `, gratuite dès ${money(threshold)} d'achat` : ""}.`;
  const phone = String(store.whatsapp_number || "").replace(/\D/g, "");
  const out: string[] = [
    `# ${line(store.name)}`,
    "",
    `> ${line(plainText(store.seo_description || store.description, 300)) || `Boutique en ligne ${line(store.name)} en Tunisie.`}`,
    "",
    `- Site : ${url()}`,
    "- Pays : Tunisie. Prix en dinars tunisiens (DT, TND).",
    "- Paiement : à la livraison (cash on delivery).",
    `- ${delivery}`,
    phone.length >= 8 ? `- WhatsApp : +${phone.length === 8 ? `216${phone}` : phone}` : null,
    store.contact_email ? `- E-mail : ${line(store.contact_email)}` : null,
    `- Langue : ${store.storefront_language === "ar" ? "arabe" : store.storefront_language === "both" ? "français et arabe" : "français"}`,
    "- Commander : ouvrir la fiche produit, choisir la variante, remplir nom, téléphone et adresse. Aucun compte ni carte bancaire nécessaire.",
    `- Suivi de commande : ${url("/track")}`,
  ].filter((l): l is string => l !== null);

  const list = products || [];
  if (list.length) {
    out.push("", `## Produits (${list.length})`, "");
    for (const p of list) {
      const compare = Number(p.compare_at_price) > Number(p.selling_price) ? ` (au lieu de ${money(p.compare_at_price)})` : "";
      const stock = productInStock(p) ? "" : " — épuisé";
      const desc = line(plainText(p.description, 160));
      out.push(`- [${line(p.name)}](${url(`/p/${p.id}`)}) : ${money(p.selling_price)}${compare}${stock}${desc ? `. ${desc}` : ""}`);
    }
  }

  const extra = (pages || []).filter((p) => !p.is_homepage && p.slug && !["home", "checkout", "cart", "panier", "merci", "track", "product-detail"].includes(p.slug));
  if (extra.length) {
    out.push("", "## Pages", "");
    for (const p of extra) out.push(`- [${line(p.title || p.slug)}](${url(`/${p.slug}`)})`);
  }

  out.push("", `Boutique propulsée par Dropy (${SITE_URL}).`, "");
  return text(out.join("\n"));
}

async function platformLlms() {
  const posts = await publishedPosts().catch(() => []);
  const page = (path: string, title: string, note: string) => `- [${title}](${SITE_URL}${path}) : ${note}`;
  const out = [
    "# Dropy",
    "",
    "> Dropy est une plateforme e-commerce tunisienne tout-en-un, en français et en arabe : boutique en ligne, paiement à la livraison, gestion des commandes, fournisseurs et créateurs de contenu UGC.",
    "",
    "## L'essentiel",
    "",
    "- Pour qui : commerçants, marques et entreprises en Tunisie qui veulent vendre en ligne.",
    "- Offre de lancement : l'équipe Dropy crée gratuitement la boutique en ligne de l'entreprise. Pas d'abonnement ni de commission pendant le lancement ; les utilisateurs sont prévenus avant tout changement.",
    "- Paiement à la livraison intégré, prix en dinars tunisiens (TND).",
    "- Boutiques en français, en arabe (de droite à gauche) ou dans les deux langues.",
    "- Adresse offerte en sous-domaine (nom.dropy.store) ou nom de domaine personnel.",
    "- Protection contre les fausses commandes : score de fiabilité du client calculé sur tout le réseau Dropy, liste noire, détection des doublons.",
    "- Relance des paniers abandonnés par appel ou WhatsApp.",
    "- Pixels Facebook, TikTok et Google Analytics, données structurées produit pour Google.",
    "- Missions de contenu UGC avec des créateurs tunisiens, paiement sécurisé par séquestre.",
    "",
    "## Pages principales",
    "",
    page("", "Accueil", "présentation de Dropy"),
    page("/vendeurs", "Vendeurs", "créer et gérer sa boutique"),
    page("/tarifs", "Tarifs", "gratuit pendant le lancement"),
    page("/creation-site-ecommerce-tunisie", "Création de site e-commerce en Tunisie", "guide et offre"),
    page("/fournisseurs", "Fournisseurs", "proposer ses produits aux vendeurs"),
    page("/createurs", "Créateurs UGC", "missions de contenu rémunérées"),
    page("/outils", "Outils gratuits", "TVA, prix de vente, marge, facture, lien WhatsApp, QR code"),
    page("/faq", "FAQ", "questions fréquentes"),
    page("/contact", "Contact", "parler à l'équipe"),
  ];
  if (posts.length) {
    out.push("", "## Blog", "");
    for (const post of posts.slice(0, 30)) out.push(`- [${line(post.title)}](${SITE_URL}/blog/${post.slug})${post.excerpt ? ` : ${line(post.excerpt).slice(0, 160)}` : ""}`);
  }
  out.push("");
  return text(out.join("\n"));
}

export async function GET() {
  const host = (await headers()).get("host");
  const slug = await storeSlugForHost(host, storeSlugFromHost, isPlatformHost);
  return slug ? storeLlms(slug) : platformLlms();
}
