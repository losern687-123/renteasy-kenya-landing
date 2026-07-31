## Two fixes first

**Admin Payments blank page — cause confirmed.** `AdminPayments.tsx` filters with `payment.tenant_name.toLowerCase()`. A query against the live table shows the single existing rent record has a null `tenant_name`, so the component throws on render and React unmounts the tree — the white screen in your screenshot. Fix: null-safe filtering for `tenant_name` / `property_name`, plus an error boundary fallback so an admin page never renders blank again. Also correct the stats maths on that page — it sums `status === 'paid'` / `'pending'` in lowercase while the database now stores title-case `Paid` / `Pending` / `Unpaid` / `Overdue`, so those cards currently read KES 0.

**Hero eyebrow overlapping the navbar.** The nav is absolutely positioned over the hero, and the hero's content block only has top padding below the `md` breakpoint (`pt-28 md:pt-0`). On desktop "— The Private Collection" slides under the logo row. Fix: keep top padding at all sizes so hero copy always clears the nav bar.

## Marketing site

Ten new pages, all in the existing Noir & Gold luxury system (Cormorant Garamond headings, Karla body, `#0d0d0d` / `#c9a84c`) — matching the landing page, not the Forest Green spec. Payments copy says "M-Pesa, card and bank transfer via Paystack", which is what the platform actually does.

**Shared shells (built once, reused):**
- `MarketingLayout` — luxury nav + footer wrapper for every marketing page
- `ProductPage` template driven by a content object: hero, benefits, feature grid, use-case testimonials, tier availability table, FAQ accordion, closing CTA
- Reusable `TierMatrix`, `FaqAccordion`, `UseCaseCards`, `EmailCaptureForm`

**Product pages** (`/products/…`): rent-tracking, tenant-management, marketplace, analytics, bulk-operations, messaging, services (coming-soon with interest capture). Content follows your brief, with feature claims trimmed where the platform doesn't yet do them (WhatsApp two-way, SMS) — those are labelled "coming soon" rather than sold as live.

**Pricing** (`/pricing`) — monthly/annual toggle with the 10% annual badge, four cards with Pro highlighted, expandable feature-comparison accordion, pricing FAQ. Existing tiers unchanged. `/pricing/compare` renders the full feature matrix with a sticky header row and quick-link sidebar.

**Resources** (`/resources`) — tabbed hub. Blog tab lists 8 articles, each a real written page at `/resources/blog/:slug`. Guides tab lists the six guides as "coming soon" with email capture (no PDFs generated). Newsletter tab holds the signup form.

**Forms** all reuse the existing waitlist path — `send-waitlist-email` edge function with a source/interests field so newsletter, services waitlist and guide interest are distinguishable. No new tables.

**Navigation** — a Products mega-dropdown added to the luxury nav (Platform Features / Services / Resources columns) on desktop, and an expandable section in the existing mobile drawer.

## Technical notes

- New route entries in `src/App.tsx`; all marketing routes public.
- Per-page `<title>`, meta description and canonical via a small `Seo` component; JSON-LD `Product`/`FAQPage` on product pages; sitemap entries added.
- Hero/section imagery generated to match the existing architectural photography; screenshots of live dashboards used where the brief asks for interface visuals.
- Mobile-first, 44px tap targets, `prefers-reduced-motion` respected via the existing global rule.
- No changes to pricing tiers, database schema, RLS, or any tenant/landlord workflow.
