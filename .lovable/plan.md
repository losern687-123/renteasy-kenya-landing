# Noir & Gold across every dashboard

Bring the dashboards, settings screens and their cards/tables/charts fully in line with the landing page, and make the property background imagery cheap to load.

## 1. One layout pattern everywhere

Every dashboard route gets the same three ingredients the landing page uses: fixed property backdrop, editorial banner with gold hairline + serif headline, and scrimmed content area.

- Already wired: Admin, Landlord, Seeker and Tenant shells (`AdminLayout`, `LandlordLayout`, `SeekerLayout`, `DashboardLayout`).
- Missing the pattern and to be fixed: `SubscriptionSettings`, `Chat`, `TenantReceipt` — wrap them in the matching role layout (or add backdrop + banner directly where a layout would break the page, e.g. the printable receipt keeps a clean print view).
- Settings screens (`AdminSettings`, `TenantSettings`, `LandlordSettingsTab`, `SubscriptionSettings`) get a consistent banner eyebrow ("Administration", "Tenant Account", "Landlord Portfolio", "Subscription") and identical section spacing.
- Replace the plain desktop header in `SeekerLayout` with the same sticky scrim header used by the landlord shell so all four shells behave identically.

## 2. Themed cards, tables and charts

- Introduce a shared "editorial surface" treatment on `Card`-based dashboard panels: translucent card background over the backdrop, gold hairline border, subtle serif card titles. Driven by new tokens (`--surface-card`, `--surface-card-border`, `--hairline-gold`) defined for both light and dark so contrast stays readable in each theme.
- Tables: gold-tinted header row, hairline row dividers, hover tint, muted-foreground body text — applied via a single shared class so every table (payments, tenants, properties, listings, audit logs, subscriptions, seekers) picks it up.
- Charts (`RevenueChart`, `PaymentStatusChart`, `PropertyPerformanceChart`, `SubscriptionCharts`): swap remaining literal colours for a shared chart palette built on `--primary` (gold), `--accent` and status tokens; theme the tooltip/legend/grid so they read correctly in both modes.
- Badges and KPI cards (`MetricCard`, `AnalyticsKPICards`, `SubscriptionBadge`) align to the same gold accent scale instead of ad-hoc colours.

## 3. Faster, responsive background imagery

- Generate resized variants of the backdrop/hero images (approx 640 / 1280 / 1920 wide) and serve them via `srcset` + `sizes` in `EditorialBackdrop`, `PageBanner` and `HeroVeil`, so phones fetch a small file.
- `EditorialBackdrop` and `PageBanner` stay `loading="lazy"` with explicit `width`/`height` and `decoding="async"`; the landing hero stays eager as the LCP element and gets a matching `<link rel="preload">`.
- Skip the backdrop image entirely below a small breakpoint where the scrim already hides most of it, falling back to the veil gradient — keeps mobile dashboards light.

## Technical notes

- New tokens live in `src/index.css` under both `:root` and `.dark`; no hardcoded colour utilities in components.
- Shared surface/table classes added as Tailwind `@layer components` utilities so existing pages need only a class swap.
- No backend, query or business-logic changes — presentation only.
- Verification: capture light and dark screenshots of tenant, landlord, admin, seeker dashboards plus each settings page, and confirm no console errors.
