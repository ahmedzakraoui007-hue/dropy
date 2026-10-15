# Dropy — Action plan to a functional platform

_Audit date: 2026-10-13 · Based on the code in this repository (commit after `88c6e84`)._

## Where things stand

The product surface is large (≈350 files, 4 portals, store builder, storefront, UGC marketplace), but the
**core business loop does not work end to end**, and several parts are **unsafe to run in production**.
The main causes:

1. **The database is not in the repository.** Only 8 small "fix" migrations exist; the 55 tables the code
   uses, their security rules (RLS) and functions (`transition_order`, `decrement_store_stock`, …) live only
   in the Supabase dashboard. Nobody can review, test or reproduce them.
2. **Two or three versions of the same thing coexist**, built at different times, and different screens use
   different ones:

   | Concept | Versions in use |
   |---|---|
   | Customer orders | `store_orders` (checkout, seller) **and** `orders` (supplier dashboard, supplier actions, delivery webhook) |
   | Store identity / slug | `stores.slug` (signup, sub-pages, checkout) **and** `store_configs.store_slug` (storefront home, middleware) **and** `seller_profiles.store_slug` (store builder) |
   | UGC missions | `content_briefs / content_applications / content_payments` **and** `ugc_briefs / ugc_applications / ugc_payments` |
   | Media | `media` **and** `media_library` |
   | Account status | `active` and `approved` both mean "approved" depending on the screen |

3. **Payments are built on Stripe**, which does not support Tunisian merchants or the TND currency
   (checkout uses `tnd`, UGC escrow uses `eur`).
4. **Delivery integration is a guess**: the "Tunisie Livraison" API URL is invented and silently falls back
   to fake tracking numbers.

---

## Phase 0 — Security fixes (do first, before any real user)

| # | Problem | Where | Fix | Size |
|---|---|---|---|---|
| 0.1 | **Checkout trusts prices sent by the browser** — a shopper can pay 1 TND for anything | `api/store/orders` | Recompute every line from `store_products` server-side; check each product belongs to the store, is active and in stock | M |
| 0.2 | **Dashboards are not protected by role** — middleware only checks "logged in"; only `/admin` checks role, and only in the browser | `middleware.ts`, `*LayoutClient.tsx` | Enforce role + `status = active` per route prefix in middleware (server-side) | S |
| 0.3 | **Any logged-in user can overwrite or delete any shop's images** | migration `relax_storage_rls` | Restrict storage writes to the owner's folder (`<user_id>/…`) | S |
| 0.4 | **Anyone can create Stripe products** | `api/stripe/setup-products` | Admin-only, or delete (one-off script) | S |
| 0.5 | **Anyone can trigger "new mission" notifications to all creators** | `api/content/briefs/[id]/publish` | Require the brief owner | S |
| 0.6 | Public test endpoints (one sends email to a fixed address) | `api/test`, `api/test-mail` | Delete | S |
| 0.7 | Scripts using the service-role key inside the app bundle folder | `src/lib/create-test-users.ts`, `create-final-test-users.ts`, `list-users.ts`, `test-create.ts` | Move to `scripts/` or delete | S |
| 0.8 | Reviews are published instantly and "verified purchase" can be faked by guessing an email | `api/reviews/*` | Status `pending` + moderation, verify via order number | S |
| 0.9 | RLS policies unknown | Supabase | Audit every table once the schema is in the repo (Phase 1) | M |

### Phase 0 status (2026-10-14)

Done in code: 0.1–0.8, plus issues found while fixing them:
- Checkout: server recomputes prices, discounts and stock; card payment disabled until a Tunisian gateway exists (Stripe cannot charge TND); storefront checkout was sending cart-row IDs and reading the wrong URL parameter (every order failed).
- Escrow release (`content/briefs/[id]/release-funds`, `ugc/briefs/[id]/release-payment`) and `accept-creator` now require the brief owner — any logged-in user could release a creator's payment.
- `notifications/send`: only admins send free-form notifications; creators can only notify the seller of their own delivered brief.
- Delivery webhook verifies an HMAC signature (`DELIVERY_WEBHOOK_SECRET`); disabled until set.
- Disputes compared `stores.user_id` (does not exist) instead of `seller_id`.
- Role/status enforced server-side in middleware; `/seller`, `/supplier`, `/creator` marketing pages are public again.

Still open:
- **Apply** `supabase/migrations/20261014090000_storage_owner_only.sql` to the live database.
- 0.9 RLS audit — needs the schema (Phase 1.1). Check in particular whether anonymous users can read `store_orders` (customer data).
- **Credentials in the public repository**: `admin@dropy.store`, `admin.test@dropy.store`, `test-admin-orchids@gmail.com`, `test-admin@dropy.tn` and the other test accounts had passwords committed. Delete them or change their passwords in Supabase.

### Live database findings (2026-10-15)

Checked against the live project with the API (no SQL access):
- **Anonymous visitors could read all profiles (emails, phones, bank details), all customer orders and notifications.** Fix ready: `supabase/migrations/20261015090000_block_anonymous_private_data.sql` — must be run in the Supabase SQL editor. The app no longer needs anonymous access to these tables.
- `stores` owner column is `vendor_id` (code used `seller_id`, which does not exist) — fixed everywhere.
- `store_configs.store_slug` does not exist — public shops now resolve by `stores.slug`.
- Live systems: `store_orders` (not `orders`, 0 rows) and `content_*` (not `ugc_*`, 0 rows). `carts`, `cart_items`, `media` tables do not exist.
- Two section formats exist in `store_pages.sections` (`config` from the current builder, `content` from an older one).
- Still unknown: policies for logged-in users (need `pg_policies` output).

## Phase 1 — Make the database the source of truth

| # | Task | Size |
|---|---|---|
| 1.1 | **Pull the live schema into the repo** (`supabase db pull`) so tables, RLS and functions are versioned | S — **needs your Supabase access** |
| 1.2 | Pick one table per concept (proposal: `store_orders`, `stores` as the single owner of the slug, `content_*` for UGC, `media_library`) and migrate data / delete the others | L |
| 1.3 | One account-status vocabulary: `pending → active / rejected / suspended` | S |
| 1.4 | Create the store row **and** its config automatically at seller signup (today nothing creates `store_configs`, so new storefronts and the builder have nothing to load) | S |
| 1.5 | Restore the foreign keys dropped by the "urgent fix" migrations | S |
| 1.6 | Create orders atomically in one Postgres function (order + items + stock + supplier orders), with stock checks and unique order numbers | M |
| 1.7 | Generate TypeScript types from the schema (`supabase gen types`) and use them | S |

## Phase 2 — Make the core loop work end to end

The loop that makes Dropy a business:

```
Seller signs up → admin approves → seller creates store → imports supplier products / adds own
→ store live at dropy.store/<slug> → customer orders (cash on delivery)
→ seller sees order → supplier gets its part → accepts / prepares / hands to courier
→ delivered → seller margin & supplier payout recorded
```

| # | Known break in the loop | Fix | Size |
|---|---|---|---|
| 2.1 | Admin approval: some screens set `approved`, others expect `active`; no store activation on approval | Single approval action (status + store activation + email) | S |
| 2.2 | Storefront home looks up `store_configs.store_slug`, sub-pages and checkout look up `stores.slug` → stores can 404 | Unify on `stores.slug` (after 1.2) | S |
| 2.3 | "View my shop" in the store builder links to `/shop/<slug>`, a route that doesn't exist | Link to `/<slug>` | S |
| 2.4 | Supplier accept/prepare/ready update `orders.order_id`, but checkout links via `store_order_id` → seller never sees supplier progress | Sync `supplier_orders` → `store_orders` status | M |
| 2.5 | Supplier dashboard & analytics read `orders` / `payments` → always empty for real orders | Read `supplier_orders` | S |
| 2.6 | No email/notification to seller and supplier on new order | Email + in-app notification | S |
| 2.7 | Product import from supplier catalog: verify price/stock sync and margin calculation | Test + fix | M |
| 2.8 | Order tracking page `/track/<number>` uses guessable `DRP-XXXXXX` numbers and shows customer data | Add phone check or signed link | S |
| 2.9 | Write one Playwright test that walks the whole loop, run it in CI | M |

## Phase 3 — Payments & delivery that work in Tunisia

| # | Decision / task | Notes |
|---|---|---|
| 3.1 | **Cash on delivery as the default** for storefronts (already partly built) | Works today once 0.1 and 1.6 are done |
| 3.2 | **Online payment**: replace Stripe with a Tunisian gateway (e.g. Konnect, Flouci, Paymee — choose one) | Needs your choice + merchant account |
| 3.3 | **Seller subscriptions**: Stripe can't bill in TND for a Tunisian company → local gateway, or bank transfer / D17 with manual admin activation for the first months | Decision needed |
| 3.4 | **UGC escrow** (creator payments in EUR via Stripe): for launch, run it manually (admin marks paid/released) | Remove Stripe escrow calls or hide the feature |
| 3.5 | **Delivery**: integrate one real courier with a real API contract; until then, let the supplier type the tracking number manually and remove the fake fallback | Decision needed |
| 3.6 | Payout ledger: what the platform owes each supplier/creator and what was paid | M |

## Phase 4 — Clean up what is half-built

- Hide or finish screens marked "Bientôt disponible" (seller settings tabs, marketing tools, supplier analytics).
- Remove simulated features shown as real: AI assistant, performance dashboard, "trending/winning" metrics, mocked supplier comparison.
- Split the 1 000–2 000-line files (`store-builder/builder/page.tsx`, `preview/[slug]/page.tsx`, `SectionEditor.tsx`, `products/add/page.tsx`, `orders/[orderId]/page.tsx`).
- Remove leftover tooling: `src/visual-edits/VisualEditsMessenger.tsx` (Orchids editor bridge, 2 000 lines), `.orchids/`, committed `playwright-report/`, `test_output.log`, `check_ports.py`.
- Storefront mobile menu (marked TODO), cart error rollback (TODO).
- Language: store the FR/AR choice in a cookie so Arabic pages render in Arabic from the server (no French flash).

## Phase 5 — Ready to launch

- Turn type and lint checks back on in the build (`ignoreBuildErrors` / `ignoreDuringBuilds` are `true` today). Quick win: TypeScript passes and ESLint reports only 2 errors.
- Restrict `next.config` `images.remotePatterns` (currently any host, http included).
- Error monitoring (e.g. Sentry) and basic uptime alerts.
- Environment variables checklist in Vercel: Supabase (3), SMTP (5), `NEXT_PUBLIC_SITE_URL`, payment gateway, courier, `UNSPLASH_ACCESS_KEY`.
- Domain, verified sender email, legal pages reviewed (CGU, privacy — Tunisian law on personal data, INPDP).
- Seed data for a demo store; admin runbook (approve accounts, handle disputes, pay out).

---

## Already done (this session)

- Login / signup fixed and redesigned; Google login removed; confirmation, resend and password-reset flows rebuilt on `/auth/confirm`; role self-assignment to `admin` blocked.
- Emails moved from Resend to SMTP (nodemailer) — **SMTP variables still to be added in Vercel**.

## What I need from you to continue

1. **Supabase access for the schema** — either run `npx supabase db pull` yourself and push, or put the project's keys in a local `.env.local` (never in chat) so I can inspect the database. This unblocks Phase 0.9, all of Phase 1 and most of Phase 2.
2. **Decisions**: online payment gateway (3.2), how sellers pay their subscription (3.3), courier (3.5), and which UGC model to keep.
3. SMTP settings in Vercel so signup emails go out.

## Suggested order

**Week 1:** Phase 0 (all) + 1.1 · **Week 2:** rest of Phase 1 · **Weeks 3–4:** Phase 2 with the end-to-end test ·
**Then:** Phase 3 decisions → integration · Phases 4–5 in parallel before public launch.
