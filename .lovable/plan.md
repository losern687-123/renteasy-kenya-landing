## Problem

In `UpgradeModal`, when a landlord clicks a tier (e.g. Starter), that card shows "Redirecting…" and every other tier's Upgrade button becomes disabled until Paystack returns the `authorization_url`. If the redirect is slow or the user changes their mind, they can't pick Professional or Enterprise — matching the screenshot.

## Fix (frontend only, no business logic changes)

Edit `src/components/subscription/UpgradeModal.tsx`:

1. Stop disabling sibling tier buttons. Pass `disabled={false}` (or drop the prop) to `PricingCard` so every non-current, non-free tier stays clickable.
2. Allow re-clicking a different tier while one is in flight: in `handleUpgradeClick`, if `loadingTier` is already set and the user picks a different tier, switch `loadingTier` to the new tier and continue — the previous pending Paystack init is superseded (idempotency guard in `paystack-initiate` already handles duplicate pending rows within 10 min).
3. Keep the clicked tier's own button showing the "Redirecting…" spinner (unchanged).
4. Allow closing the modal while loading: change `onOpenChange={(o) => !loadingTier && onOpenChange(o)}` to `onOpenChange={onOpenChange}` so the user isn't trapped.
5. Free tier and current tier keep their existing non-clickable states (that's correct behavior, not a bug).

No changes to `PricingCard`, edge functions, DB, or the `SubscriptionSettings` page grid (which already passes no `disabled` prop).

## Verification

- Open Upgrade modal → click Starter → while it's "Redirecting…", click Professional → Professional becomes the loading card and redirects to Paystack for the Pro amount.
- Free shows "Free Plan" (disabled) and current tier shows "Current Plan" (disabled) — unchanged.
