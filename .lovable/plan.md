## Current state

- **Upgrade modal** (`src/components/subscription/UpgradeModal.tsx`) currently collects phone + company and inserts a row into `subscription_requests` for manual fulfillment — no Paystack call.
- **Subscription tiers in DB**: `free` (KES 0), `pro` (KES 3,999), `enterprise` (KES 12,999), `custom`. Pricing does not match what you specified. update the prices
- `**paystack-initiate**` edge function already accepts `payment_type: "subscription"` with `metadata: { landlord_id, tier }`. No edge-function changes needed.
- **Tier name "pro"** is referenced across ~12 files (`SubscriptionBadge`, `PricingCard`, `LockedFeatureCard`, hooks, sidebars, analytics gating). Renaming it would touch all of them and risk breaking gating logic — so we'll keep the internal name `pro` and just change its **display name + price**.
- `**LockedFeatureCard**` already calls `onUpgrade` prop. Each consumer (analytics, reports) wires that to open the upgrade modal — but I should audit that all locked surfaces actually pass an `onUpgrade` that opens the modal.
- **No subscription badge** currently appears in the landlord sidebar/header (only inside `SubscriptionOverviewCard` on the overview tab).

---

## Implementation plan

### Part 0 — Database tier alignment (one migration)

Update `subscription_tiers` to match your pricing without breaking the `pro` tier-name references:

```sql
-- Update existing tiers
UPDATE subscription_tiers SET price_monthly = 0,    price_annual = 0,      display_name = 'Free',         sort_order = 1 WHERE name = 'free';
UPDATE subscription_tiers SET price_monthly = 999,  price_annual = 9990,   display_name = 'Professional', sort_order = 3 WHERE name = 'pro';
UPDATE subscription_tiers SET price_monthly = 2499, price_annual = 24990,  display_name = 'Enterprise',   sort_order = 4 WHERE name = 'enterprise';

-- New Starter tier (kept distinct internal name)
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_annual, max_properties, max_tenants, features, sort_order, is_active)
VALUES ('starter', 'Starter', 'For small landlords getting started', 499, 4990, 10, 25,
        '["Up to 10 properties","Up to 25 tenants","Email reminders","Basic analytics"]'::jsonb, 2, true)
ON CONFLICT DO NOTHING;

-- Hide 'custom' from the 4-tier upgrade grid
UPDATE subscription_tiers SET is_active = false WHERE name = 'custom';
```

Annual prices = monthly × 10 (≈17% saving). Property/tenant limits for Starter are reasonable defaults; tell me if you want different numbers.

### Part 1 — Wire UpgradeModal to Paystack (`src/components/subscription/UpgradeModal.tsx`)

Rewrite the modal so the "Upgrade" button on each `PricingCard` calls Paystack directly instead of opening the request form:

- Drop the `subscription_requests` insert flow, the phone/company form, the `requestSchema`, and the success screen.
- New `handleUpgradeClick(tier)`:
  - Guard: `tier.name === "free"` or `tier.name === currentTier` → no-op.
  - Set per-button loading state (`loadingTier: string | null`) and disable *all* upgrade buttons while one is in flight.
  - Call `supabase.functions.invoke("paystack-initiate", { body: { payment_type: "subscription", amount: Math.round(price), email: user.email, metadata: { landlord_id: user.id, tier: tier.name } } })`.
    - `price` = `priceMonthly` when `billingCycle==="monthly"`, else `priceAnnual`.
  - Success → `window.location.href = data.authorization_url`.
  - Error → `toast.error(...)`, clear loading.
- Add "Recommended" badge logic: highlight the next tier above the current one (e.g. current=free → recommended=starter; current=starter → recommended=pro). Pass new prop `isRecommended` into `PricingCard`.

### Part 1b — `PricingCard` updates

- Accept new `isRecommended?: boolean` and `isLoading?: boolean` props.
- Render "Recommended" badge (forest-green) when `isRecommended`.
- Button label: `Upgrade to {displayName}` (per spec), and shows `<Loader2 spinning />` when `isLoading`.
- Keep existing "Current Plan" badge + disabled-button behavior.

### Part 2 — Paystack callback handling on Landlord dashboard (`src/pages/LandlordDashboard.tsx`)

Add a mount-time effect that mirrors the tenant dashboard pattern:

```ts
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("reference") && !params.get("trxref")) return;
  const handled = useRef(false); // module-level ref so it runs once
  // toast "Verifying your payment, please wait..."
  // setTimeout 3000ms:
  //   queryClient.invalidateQueries({ queryKey: ["subscription-limits"] })
  //   queryClient.invalidateQueries({ queryKey: ["subscription-tiers"] })
  //   toast.success("Subscription upgraded! Your new features are now active.")
  //   setUpgradeModalOpen(false)
  //   window.history.replaceState({}, "", window.location.pathname)
}, []);
```

Uses `useQueryClient()` from `@tanstack/react-query`. No webhook verification on the client; the existing `paystack-webhook` is the source of truth for the DB.

### Part 3 — Subscription tier badge in landlord header/sidebar

Audit `LandlordLayout`/`LandlordSidebar`. Add a small `SubscriptionBadge` in the sidebar footer (or header right side on desktop) using `useSubscriptionLimits().tierName`:

- Map `tierName` → badge variant. Extend `SubscriptionBadge` to accept `"starter"` (with Forest Green styling for all paid tiers per your spec, muted for free).
- Next to the badge, if `tierName === "free"`, render a small `<button>Upgrade</button>` link that calls a new `onUpgradeClick` prop. `LandlordLayout` wires it to `setUpgradeModalOpen(true)` shared with the dashboard.
- For paid tiers, badge only (Forest Green bg-primary/10 text-primary border-primary/30).

This means `LandlordLayout` needs to own (or receive) the upgrade-modal open state so the badge button and dashboard tabs share one modal instance. Simplest: lift `upgradeModalOpen` into `LandlordLayout` via context **or** keep dashboard ownership and pass `onUpgradeClick` down through layout props. I'll go with the latter (minimal surface change): `LandlordLayout` accepts `onUpgradeClick?: () => void`.

### Part 4 — Locked feature cards open the upgrade modal

- Audit every `<LockedFeatureCard onUpgrade={...} />` site (`AnalyticsDashboard`, `ReportsTab`). Confirm each one calls `setUpgradeModalOpen(true)` or an equivalent prop bubbled up from `LandlordDashboard`. Fix any that don't.
- Add a small "Upgrade to unlock" label with the `Lock` icon above the button if it's not already visually present (it currently shows `Lock` icon + tier badge, but the explicit "Upgrade to unlock" copy is missing — add it as a muted-foreground caption).
- **No gating changes** — `tierRequired` checks and `useSubscriptionLimits` are untouched.

---

## Untouched (explicitly)

- `paystack-initiate`, `paystack-webhook`, all other edge functions
- `paystack_transactions`, `rent_records`, `tenants`, `profiles`, `notifications`, all RLS, all SECURITY DEFINER functions
- Tenant Pay Now / Cash / Bank Transfer / payment history / Landlord Link card / settings
- Landlord properties, tenants, payments, analytics, reports, bulk CSV, marketplace, chat, notifications
- Admin pages and admin auth
- Seeker pages
- Auth flows, RBAC, RouteGuard
- Theme / Realtime / Resend / WhatsApp handoff

The `subscription_requests` table is left in place (only the modal's *use* of it is removed) — if you later want a hybrid "request quote" path for Custom/Enterprise, the table stays available.

## Warnings

1. **DB price change is destructive to existing data semantics.** Any landlord currently subscribed to "pro" at 3,999 will, on next renewal/UI render, see 999. No existing `landlord_subscriptions` rows are modified, but next checkout uses the new price. If you have any paying customer on the old pricing, tell me and I'll grandfather them.
2. **Internal tier name stays `pro**`, display becomes `Professional`. This avoids touching 12 files but means edge functions and gating logic still receive `tier: "pro"` in metadata — the webhook must map `pro → Professional` when updating subscriptions if it uses display names anywhere (quick check needed during impl).
3. **Annual savings** default to ~17% (monthly × 10). Change if you want a different discount.
4. Webhook is the source of truth — the dashboard's "Subscription upgraded!" toast fires after a 3s delay regardless of whether the webhook has actually completed. If the webhook is slow the user may see the toast before tier limits flip. The TanStack invalidation will re-fetch and correct itself.
5. Custom tier is set to `is_active = false`. If you want it visible somewhere (e.g. a separate "Need more? Contact sales" CTA), tell me and I'll keep it active and filter it out only in the 4-tier grid instead.