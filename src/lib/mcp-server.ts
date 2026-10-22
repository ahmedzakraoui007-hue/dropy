import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashMcpToken } from "@/lib/mcp-tokens";
import { themes } from "@/lib/themes";
import { importCatalogProductIntoStore, CATALOG_IMPORT_MESSAGES } from "@/lib/catalog-import";
import { normalizeOffers } from "@/lib/store-pricing";
import { storeUrl } from "@/lib/store-url";

type Admin = ReturnType<typeof createAdminClient>;
type Ctx = { admin: Admin; userId: string; store: Record<string, any> };
type JsonRpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: any };

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const SECTION_TYPES: Record<string, string> = {
  hero: "Bannière principale. config: title, subtitle, badge, ctaText, ctaLink (ex. /shop), secondaryCtaText, backgroundImage (URL), variant ('bold' | 'classic' | 'split' | 'video'), videoUrl, height (px), overlay (bool), textPosition ('left' | 'center' | 'right').",
  products: "Grille de produits de la boutique. config: title, limit (nombre), columns (2-4), source: 'store'.",
  store_categories: "Catégories de la boutique. config: title, columns, limit.",
  features: "Avantages / points forts. config: title, features: [{ title, description, icon? }].",
  trust_badges: "Garanties (livraison, paiement...). config: layout: 'row', items: [{ icon ('Truck' | 'Shield' | 'RotateCcw' | 'Headphones' | 'CreditCard' | 'Award'), title, description }].",
  testimonials: "Avis clients. config: title, testimonials: [{ name, text, rating (1-5), location? }].",
  faq: "Questions fréquentes. config: title, faqs: [{ question, answer }].",
  image_with_text: "Image + texte. config: title, text, image (URL), imagePosition ('left' | 'right'), ctaText, ctaLink.",
  cta_banner: "Appel à l'action. config: title, subtitle, ctaText, ctaLink.",
  promo_banner: "Bandeau promo fin. config: text, link.",
  countdown: "Compte à rebours. config: title, subtitle, endDate (ISO 8601), ctaText, ctaLink, expiredText.",
  newsletter: "Inscription newsletter. config: title, subtitle, placeholder, buttonText.",
  video: "Vidéo. config: title, url (YouTube/Vimeo/MP4).",
  about: "Texte libre. config: title, content (HTML simple: p, h3, strong, ul, li).",
  stats: "Chiffres clés. config: title, stats: [{ value, label }].",
  process_steps: "Étapes. config: title, steps: [{ title, description }].",
  logo_carousel: "Logos. config: title, logos: [URL].",
  contact: "Contact. config: title, subtitle, phone, email, address, whatsapp, hours.",
  collections: "Collections. config: title, columns, items: [{ title, image, link }].",
  recommended_products: "Produits recommandés. config: title, limit, columns.",
  footer: "Pied de page. config: brandName, description, copyright.",
};
const ALIASES = ["featured_products", "product_grid", "icon_grid", "benefits", "brand_logos", "faq_preview", "about_preview", "rich_text", "categories", "categories_grid", "collection_grid", "banner"];
const ALLOWED_TYPES = new Set([...Object.keys(SECTION_TYPES), ...ALIASES]);
const SYSTEM_PAGES = new Set(["checkout", "cart", "panier", "merci", "track", "product-detail", "p"]);

class ToolError extends Error {}

const ok = (data: unknown) => ({ content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] });

function str(value: unknown, field: string, max = 500, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ToolError(`« ${field} » est obligatoire.`);
    return undefined;
  }
  if (typeof value !== "string") throw new ToolError(`« ${field} » doit être un texte.`);
  return value.trim().slice(0, max);
}

function num(value: unknown, field: string, min: number, max: number) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new ToolError(`« ${field} » doit être entre ${min} et ${max}.`);
  return n;
}

function cleanSections(raw: unknown) {
  if (!Array.isArray(raw)) throw new ToolError("« sections » doit être une liste.");
  if (raw.length > 30) throw new ToolError("30 sections maximum par page.");
  if (JSON.stringify(raw).length > 150_000) throw new ToolError("Contenu trop volumineux.");
  return raw.map((section: any, index: number) => {
    if (!section || typeof section !== "object") throw new ToolError(`Section ${index + 1} invalide.`);
    if (!ALLOWED_TYPES.has(section.type)) throw new ToolError(`Type de section inconnu : ${section.type}. Utilisez list_section_types.`);
    const config = section.config ?? section.content ?? {};
    if (typeof config !== "object" || Array.isArray(config)) throw new ToolError(`config de la section ${index + 1} invalide.`);
    return {
      id: typeof section.id === "string" && section.id ? section.id.slice(0, 64) : randomUUID(),
      type: section.type,
      config,
      position: index,
      is_visible: section.is_visible !== false,
    };
  });
}

async function loadPages(ctx: Ctx) {
  const { data } = await ctx.admin
    .from("store_pages")
    .select("id, slug, title, is_published, is_homepage, show_in_navigation, sort_order, sections")
    .eq("store_id", ctx.store.id)
    .order("sort_order", { ascending: true });
  return data || [];
}

async function findPage(ctx: Ctx, slug: string) {
  const { data } = await ctx.admin.from("store_pages").select("*").eq("store_id", ctx.store.id).eq("slug", slug).maybeSingle();
  if (!data) throw new ToolError(`Page « ${slug} » introuvable. Utilisez list_pages.`);
  return data;
}

const TOOLS: Record<string, { description: string; inputSchema: Record<string, unknown>; run: (ctx: Ctx, args: any) => Promise<unknown> }> = {
  get_store: {
    description: "Informations de la boutique : nom, adresse publique, en ligne ou non, thème, couleurs, livraison, offres, contact, nombre de produits.",
    inputSchema: { type: "object", properties: {} },
    run: async (ctx) => {
      const { count } = await ctx.admin.from("store_products").select("id", { count: "exact", head: true }).eq("store_id", ctx.store.id).eq("is_active", true);
      const s = ctx.store;
      return {
        name: s.name,
        slug: s.slug,
        url: storeUrl(s.slug),
        online: s.is_active !== false,
        description: s.description,
        logo_url: s.logo_url,
        theme_id: s.theme_config?.theme_id ?? null,
        colors: s.theme_config?.colors ?? null,
        fonts: s.theme_config?.fonts ?? null,
        seo_title: s.seo_title,
        seo_description: s.seo_description,
        whatsapp_number: s.whatsapp_number,
        delivery_fee: Number(s.delivery_fee || 0),
        free_delivery_threshold: s.free_delivery_threshold,
        quantity_offers: normalizeOffers(s.quantity_offers),
        active_products: count ?? 0,
      };
    },
  },
  update_store: {
    description: "Modifie les informations de la boutique. Tous les champs sont optionnels.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        seo_title: { type: "string", description: "60 caractères max" },
        seo_description: { type: "string", description: "160 caractères max" },
        whatsapp_number: { type: "string", description: "Numéro tunisien, 8 chiffres" },
        delivery_fee: { type: "number", description: "Frais de livraison en DT (0-100)" },
        free_delivery_threshold: { type: ["number", "null"], description: "Livraison gratuite dès ce montant (DT), null pour désactiver" },
        quantity_offers: { type: "array", description: "Ex. [{min_quantity: 2, discount_percent: 10}]", items: { type: "object" } },
        primary_color: { type: "string", description: "Couleur principale, ex. #7c3aed" },
        secondary_color: { type: "string" },
      },
    },
    run: async (ctx, args) => {
      const changes: Record<string, unknown> = {};
      const name = str(args.name, "name", 60);
      if (name) changes.name = name;
      const description = str(args.description, "description", 300);
      if (description !== undefined) changes.description = description;
      const seoTitle = str(args.seo_title, "seo_title", 60);
      if (seoTitle !== undefined) changes.seo_title = seoTitle;
      const seoDescription = str(args.seo_description, "seo_description", 160);
      if (seoDescription !== undefined) changes.seo_description = seoDescription;
      if (args.whatsapp_number !== undefined) {
        const digits = String(args.whatsapp_number).replace(/\D/g, "");
        if (digits && !(digits.length === 8 || (digits.length >= 11 && digits.length <= 15))) throw new ToolError("Numéro WhatsApp invalide.");
        changes.whatsapp_number = digits || null;
      }
      const fee = num(args.delivery_fee, "delivery_fee", 0, 100);
      if (fee !== undefined) changes.delivery_fee = fee;
      if (args.free_delivery_threshold === null) changes.free_delivery_threshold = null;
      else {
        const threshold = num(args.free_delivery_threshold, "free_delivery_threshold", 1, 100000);
        if (threshold !== undefined) changes.free_delivery_threshold = threshold;
      }
      if (args.quantity_offers !== undefined) changes.quantity_offers = normalizeOffers(args.quantity_offers);
      const colorRe = /^#[0-9a-fA-F]{6}$/;
      if (args.primary_color !== undefined || args.secondary_color !== undefined) {
        const colors = { ...(ctx.store.theme_config?.colors || {}) };
        for (const [key, value] of [["primary", args.primary_color], ["secondary", args.secondary_color]] as const) {
          if (value === undefined) continue;
          if (!colorRe.test(String(value))) throw new ToolError(`Couleur invalide : ${value} (format #RRGGBB).`);
          colors[key] = value;
        }
        changes.theme_config = { ...(ctx.store.theme_config || {}), colors };
      }
      if (!Object.keys(changes).length) throw new ToolError("Aucun changement fourni.");
      const { error } = await ctx.admin.from("stores").update(changes).eq("id", ctx.store.id);
      if (error) throw new ToolError(`Enregistrement impossible : ${error.message}`);
      return { updated: Object.keys(changes) };
    },
  },
  list_themes: {
    description: "Liste des thèmes disponibles (id, nom, catégorie, couleurs, polices).",
    inputSchema: { type: "object", properties: {} },
    run: async () =>
      themes.map((t) => ({ id: t.id, name: t.name, category: t.category, description: t.description, colors: t.colors, fonts: t.typography })),
  },
  apply_theme: {
    description: "Applique un thème (couleurs et polices). replace_home=true remplace aussi les sections de la page d'accueil par celles du thème.",
    inputSchema: { type: "object", properties: { theme_id: { type: "string" }, replace_home: { type: "boolean" } }, required: ["theme_id"] },
    run: async (ctx, args) => {
      const theme = themes.find((t) => t.id === args.theme_id);
      if (!theme) throw new ToolError(`Thème inconnu : ${args.theme_id}. Utilisez list_themes.`);
      const firstFont = (f?: string) => (f || "").replace(/['"]/g, "").split(",")[0].trim() || "Inter";
      const radius = parseFloat(theme.layout?.borderRadius || "8");
      const current = ctx.store.theme_config || {};
      const themeConfig = {
        ...current,
        theme_id: theme.id,
        colors: { ...(current.colors || {}), ...theme.colors },
        typography: { ...(current.typography || {}), fontHeading: firstFont(theme.typography?.headingFont), fontBody: firstFont(theme.typography?.bodyFont) },
        fonts: { heading: firstFont(theme.typography?.headingFont), body: firstFont(theme.typography?.bodyFont) },
        spacing: { ...(current.spacing || {}), borderRadius: radius <= 0 ? "none" : radius >= 999 ? "full" : "md" },
      };
      const { error } = await ctx.admin.from("stores").update({ theme_config: themeConfig }).eq("id", ctx.store.id);
      if (error) throw new ToolError(error.message);
      if (args.replace_home && theme.defaultSections?.length) {
        const sections = theme.defaultSections.map((s, i) => ({ ...s, id: randomUUID(), position: i }));
        const { data: home } = await ctx.admin.from("store_pages").select("id").eq("store_id", ctx.store.id).eq("is_homepage", true).limit(1).maybeSingle();
        if (home) await ctx.admin.from("store_pages").update({ sections }).eq("id", home.id);
      }
      return { applied: theme.id, home_replaced: Boolean(args.replace_home) };
    },
  },
  list_section_types: {
    description: "Types de sections utilisables dans les pages, avec leurs réglages (config).",
    inputSchema: { type: "object", properties: {} },
    run: async () => ({ section_format: "{ type, config, is_visible? }", types: SECTION_TYPES }),
  },
  list_pages: {
    description: "Pages de la boutique avec leurs sections (type et titre).",
    inputSchema: { type: "object", properties: {} },
    run: async (ctx) =>
      (await loadPages(ctx)).map((p: any) => ({
        slug: p.slug,
        title: p.title,
        homepage: p.is_homepage,
        published: p.is_published,
        in_menu: p.show_in_navigation,
        sections: (p.sections || []).map((s: any) => ({ id: s.id, type: s.type, title: (s.config ?? s.content)?.title ?? null })),
      })),
  },
  get_page: {
    description: "Contenu complet d'une page (sections avec leur config).",
    inputSchema: { type: "object", properties: { slug: { type: "string", description: "ex. home" } }, required: ["slug"] },
    run: async (ctx, args) => {
      const page = await findPage(ctx, str(args.slug, "slug", 40, true)!);
      return { slug: page.slug, title: page.title, published: page.is_published, sections: page.sections || [] };
    },
  },
  update_page: {
    description: "Remplace les sections d'une page (liste complète, dans l'ordre). Récupérez d'abord la page avec get_page.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" }, title: { type: "string" }, sections: { type: "array", items: { type: "object" } }, published: { type: "boolean" } },
      required: ["slug"],
    },
    run: async (ctx, args) => {
      const page = await findPage(ctx, str(args.slug, "slug", 40, true)!);
      const changes: Record<string, unknown> = {};
      if (args.sections !== undefined) changes.sections = cleanSections(args.sections);
      const title = str(args.title, "title", 60);
      if (title) changes.title = title;
      if (typeof args.published === "boolean" && !page.is_homepage) changes.is_published = args.published;
      if (!Object.keys(changes).length) throw new ToolError("Aucun changement fourni.");
      const { error } = await ctx.admin.from("store_pages").update(changes).eq("id", page.id);
      if (error) throw new ToolError(error.message);
      return { updated: page.slug, sections: Array.isArray(changes.sections) ? (changes.sections as unknown[]).length : undefined };
    },
  },
  create_page: {
    description: "Crée une nouvelle page (ex. à-propos, contact, livraison).",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "minuscules, chiffres et tirets" }, title: { type: "string" }, sections: { type: "array", items: { type: "object" } }, in_menu: { type: "boolean" } },
      required: ["slug", "title"],
    },
    run: async (ctx, args) => {
      const slug = str(args.slug, "slug", 40, true)!;
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || SYSTEM_PAGES.has(slug) || slug === "home") throw new ToolError("Adresse de page invalide ou réservée.");
      const existing = await ctx.admin.from("store_pages").select("id").eq("store_id", ctx.store.id).eq("slug", slug).maybeSingle();
      if (existing.data) throw new ToolError("Une page avec cette adresse existe déjà.");
      const pages = await loadPages(ctx);
      if (pages.length >= 20) throw new ToolError("20 pages maximum.");
      const { error } = await ctx.admin.from("store_pages").insert({
        store_id: ctx.store.id,
        slug,
        title: str(args.title, "title", 60, true),
        page_type: "content",
        sections: cleanSections(args.sections ?? []),
        is_published: true,
        is_homepage: false,
        show_in_navigation: args.in_menu !== false,
        sort_order: pages.length,
      });
      if (error) throw new ToolError(error.message);
      return { created: slug, url: storeUrl(ctx.store.slug, `/${slug}`) };
    },
  },
  delete_page: {
    description: "Supprime une page (pas la page d'accueil).",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    run: async (ctx, args) => {
      const page = await findPage(ctx, str(args.slug, "slug", 40, true)!);
      if (page.is_homepage || page.slug === "home") throw new ToolError("La page d'accueil ne peut pas être supprimée.");
      const { error } = await ctx.admin.from("store_pages").delete().eq("id", page.id);
      if (error) throw new ToolError(error.message);
      return { deleted: page.slug };
    },
  },
  search_catalog: {
    description: "Cherche des produits dans le catalogue des fournisseurs Dropy (à importer en dropshipping). Renvoie prix fournisseur et prix conseillé.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } } },
    run: async (ctx, args) => {
      const limit = num(args.limit, "limit", 1, 50) ?? 20;
      let query = ctx.admin
        .from("products")
        .select("id, name, base_price, compare_price, stock_quantity, sub_category, images")
        .eq("is_active", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);
      const q = str(args.query, "query", 80)?.replace(/[%,()]/g, " ");
      if (q) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      const { data: mine } = await ctx.admin.from("store_products").select("product_id").eq("store_id", ctx.store.id);
      const imported = new Set((mine || []).map((m) => m.product_id));
      return (data || []).map((p) => {
        const base = Number(p.base_price || 0);
        const compare = Number(p.compare_price || 0);
        return {
          id: p.id,
          name: p.name,
          supplier_price: base,
          suggested_price: compare > base ? compare : Math.round(base * 1.35 * 100) / 100,
          stock: p.stock_quantity,
          category: p.sub_category,
          image: p.images?.[0] ?? null,
          already_in_store: imported.has(p.id),
        };
      });
    },
  },
  import_product: {
    description: "Importe un produit du catalogue dans la boutique (variantes et stock compris). selling_price doit être supérieur au prix fournisseur.",
    inputSchema: { type: "object", properties: { catalog_product_id: { type: "string" }, selling_price: { type: "number" } }, required: ["catalog_product_id"] },
    run: async (ctx, args) => {
      const price = num(args.selling_price, "selling_price", 0.01, 100000);
      const result = await importCatalogProductIntoStore(ctx.admin, ctx.store.id, str(args.catalog_product_id, "catalog_product_id", 64, true)!, price);
      if (!result.ok) throw new ToolError(CATALOG_IMPORT_MESSAGES[result.reason]);
      return { imported: result.storeProductId, url: storeUrl(ctx.store.slug, `/p/${result.storeProductId}`) };
    },
  },
  list_products: {
    description: "Produits de la boutique.",
    inputSchema: { type: "object", properties: {} },
    run: async (ctx) => {
      const { data } = await ctx.admin
        .from("store_products")
        .select("id, name, selling_price, stock_quantity, is_active, is_dropship, category")
        .eq("store_id", ctx.store.id)
        .order("created_at", { ascending: false });
      return (data || []).map((p) => ({ ...p, url: storeUrl(ctx.store.slug, `/p/${p.id}`) }));
    },
  },
  update_product: {
    description: "Modifie un produit de la boutique : nom, description (HTML simple), prix, catégorie, visible ou non.",
    inputSchema: {
      type: "object",
      properties: { product_id: { type: "string" }, name: { type: "string" }, description: { type: "string" }, selling_price: { type: "number" }, category: { type: "string" }, active: { type: "boolean" } },
      required: ["product_id"],
    },
    run: async (ctx, args) => {
      const id = str(args.product_id, "product_id", 64, true)!;
      const { data: product } = await ctx.admin.from("store_products").select("id, product_id, is_dropship").eq("id", id).eq("store_id", ctx.store.id).maybeSingle();
      if (!product) throw new ToolError("Produit introuvable dans cette boutique.");
      const changes: Record<string, unknown> = {};
      const name = str(args.name, "name", 150);
      if (name) changes.name = name;
      const description = str(args.description, "description", 5000);
      if (description !== undefined) changes.description = description;
      const category = str(args.category, "category", 60);
      if (category !== undefined) changes.category = category;
      if (typeof args.active === "boolean") changes.is_active = args.active;
      const price = num(args.selling_price, "selling_price", 0.01, 100000);
      if (price !== undefined) {
        if (product.is_dropship && product.product_id) {
          const { data: source } = await ctx.admin.from("products").select("base_price").eq("id", product.product_id).maybeSingle();
          if (source && price <= Number(source.base_price)) throw new ToolError(`Le prix doit dépasser le prix fournisseur (${source.base_price} DT).`);
        }
        changes.selling_price = Math.round(price * 100) / 100;
      }
      if (!Object.keys(changes).length) throw new ToolError("Aucun changement fourni.");
      const { error } = await ctx.admin.from("store_products").update(changes).eq("id", id);
      if (error) throw new ToolError(error.message);
      return { updated: id, fields: Object.keys(changes) };
    },
  },
  set_online: {
    description: "Met la boutique en ligne (online=true) ou hors ligne. Il faut au moins un produit actif pour la mettre en ligne.",
    inputSchema: { type: "object", properties: { online: { type: "boolean" } }, required: ["online"] },
    run: async (ctx, args) => {
      if (args.online) {
        const { count } = await ctx.admin.from("store_products").select("id", { count: "exact", head: true }).eq("store_id", ctx.store.id).eq("is_active", true);
        if (!count) throw new ToolError("Ajoutez au moins un produit actif avant de mettre la boutique en ligne.");
      }
      const { error } = await ctx.admin.from("stores").update({ is_active: Boolean(args.online) }).eq("id", ctx.store.id);
      if (error) throw new ToolError(error.message);
      return { online: Boolean(args.online), url: storeUrl(ctx.store.slug) };
    },
  },
  list_orders: {
    description: "Dernières commandes de la boutique (statut, client, montant). Lecture seule.",
    inputSchema: { type: "object", properties: { status: { type: "string", description: "new, confirmed, preparing, shipped, delivered, cancelled" }, limit: { type: "number" } } },
    run: async (ctx, args) => {
      const limit = num(args.limit, "limit", 1, 100) ?? 20;
      let query = ctx.admin
        .from("store_orders")
        .select("order_number, created_at, status, customer_name, customer_governorate, total_amount, shipping_cost")
        .eq("store_id", ctx.store.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      const status = str(args.status, "status", 20);
      if (status) query = query.eq("status", status);
      const { data } = await query;
      return data || [];
    },
  },
};

async function authenticate(token: string | null) {
  if (!token || !token.startsWith("dropy_mcp_")) return null;
  const admin = createAdminClient();
  const { data: row } = await admin.from("seller_mcp_tokens").select("id, user_id, last_used_at").eq("token_hash", hashMcpToken(token)).maybeSingle();
  if (!row) return null;
  const { data: profile } = await admin.from("profiles").select("role, status").eq("id", row.user_id).maybeSingle();
  if (!profile || profile.role !== "seller" || !["approved", "active"].includes(profile.status)) return null;
  const { data: store } = await admin.from("stores").select("*").eq("vendor_id", row.user_id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!store) return null;
  if (!row.last_used_at || Date.now() - new Date(row.last_used_at).getTime() > 5 * 60_000) {
    await admin.from("seller_mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
  }
  return { admin, userId: row.user_id, store } satisfies Ctx;
}

async function handle(message: JsonRpc, ctx: Ctx) {
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id: message.id ?? null, result });
  const fail = (code: number, msg: string) => ({ jsonrpc: "2.0", id: message.id ?? null, error: { code, message: msg } });

  switch (message.method) {
    case "initialize": {
      const requested = message.params?.protocolVersion;
      return reply({
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "dropy-store", version: "1.0.0" },
        instructions: `Outils pour gérer la boutique Dropy « ${ctx.store.name} » (${storeUrl(ctx.store.slug)}). Commencez par get_store et list_pages. Pour modifier une page : get_page, puis update_page avec la liste complète des sections. Les types de sections sont décrits par list_section_types. Les textes de la boutique sont en français (ou en arabe si le vendeur le demande). Les prix sont en dinars tunisiens (DT).`,
      });
    }
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: Object.entries(TOOLS).map(([name, tool]) => ({ name, description: tool.description, inputSchema: tool.inputSchema })) });
    case "tools/call": {
      const tool = TOOLS[message.params?.name];
      if (!tool) return fail(-32602, `Outil inconnu : ${message.params?.name}`);
      try {
        const result = await tool.run(ctx, message.params?.arguments || {});
        return reply(ok(result));
      } catch (error) {
        const text = error instanceof ToolError ? error.message : "Erreur interne, réessayez.";
        if (!(error instanceof ToolError)) console.error("MCP tool error:", message.params?.name, error);
        return reply({ content: [{ type: "text", text }], isError: true });
      }
    }
    default:
      return fail(-32601, `Méthode non supportée : ${message.method}`);
  }
}

export async function handleMcpRequest(request: Request, pathToken?: string) {
  const header = request.headers.get("authorization");
  const token = pathToken || (header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null);
  const ctx = await authenticate(token);
  if (!ctx) {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Clé Dropy invalide ou révoquée. Créez une clé dans Ma boutique → Paramètres → Connecter Claude." } },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON invalide" } }, { status: 400 });

  const messages: JsonRpc[] = Array.isArray(body) ? body : [body];
  const responses = [];
  for (const message of messages) {
    if (message?.jsonrpc !== "2.0" || typeof message.method !== "string") {
      responses.push({ jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32600, message: "Requête invalide" } });
      continue;
    }
    if (message.id === undefined || message.id === null) continue;
    responses.push(await handle(message, ctx));
  }
  if (!responses.length) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(body) ? responses : responses[0]);
}

export const MCP_TOOL_NAMES = Object.keys(TOOLS);
