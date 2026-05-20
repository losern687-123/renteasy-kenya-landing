## Issues found

### 1. Two "Dashboard" entries in the profile dropdown (landing page)

`src/components/ProfileDropdown.tsx` renders both:

- A generic **Dashboard** item (line 192) whose `dashboardPath` for an approved landlord is `/landlord-dashboard`.
- A **Landlord Dashboard** item (line 208) that also points to `/landlord-dashboard`.

Same destination, shown twice. Same duplication exists in the mobile branch (lines 111 + 127).there should only be one landlord dashboard and it should only be available to verified landlords

### 2. "Pay Now" only supports Paystack — Cash & Bank Transfer are excluded

`src/pages/TenantDashboard.tsx` "Pay Now" jumps straight into the Paystack confirmation dialog. The `TenantAddPayment` page already supports Cash / Bank Transfer / Paystack, but the dashboard CTA bypasses that choice entirely.

### 3. Landlord ID link stuck on "Pending" — landlord never gets a notification

`src/pages/TenantSettings.tsx` `handleLandlordConnect` (lines 245–324) inserts into `tenants` with `verification_status: "pending"` and stops there. It never calls the existing `notify_landlord_of_tenant_link` RPC, so the landlord's Notifications bell shows nothing and approval can't happen.

The `LandlordLinkCard` on the dashboard is also misleading: it labels any row with a `landlord_id` as **Connected**, ignoring `verification_status`. That's why dashboard says "Connected" while Settings says "Pending".

---

## Fix plan (UI + one RPC call, no schema changes)

### A. `src/components/ProfileDropdown.tsx`

- Remove the second **Landlord Dashboard** menu item (desktop lines 208–215 and mobile lines 127–134). The generic **Dashboard** entry already routes approved landlords to `/landlord-dashboard` via `getDashboardPath()`.
- Keep the Pending / Rejected status items as-is.

### B. "Pay Now" — let tenant pick a payment method

In `src/pages/TenantDashboard.tsx` confirm dialog:

- Add a **Payment Method** `Select` with options: `Cash`, `Bank Transfer`, `Paystack (Online)` (default `Paystack` to preserve current behavior).
- Branching on submit:
  - **Paystack** → existing flow unchanged (invoke `paystack-initiate`, redirect).
  - **Cash / Bank Transfer** → update the existing unpaid `rent_records` row: `payment_method = <choice>`, `status = "Pending"`, `payment_date = today`. Show success toast ("Payment recorded. Awaiting landlord confirmation."), close dialog, bump `refreshKey`. No receipt upload in the dialog (keep that on the dedicated Add Payment page where the file input lives).
- Hide the email field unless Paystack is selected.
- Button label adapts: "Proceed to Payment" (Paystack) vs "Record Payment" (Cash/Bank).

No change to `TenantAddPayment.tsx`, edge functions, RLS, or schema.

### C. Notify landlord when a tenant links

In `src/pages/TenantSettings.tsx` `handleLandlordConnect`, after the successful `tenants` insert (line 312), call:

```ts
await supabase.rpc("notify_landlord_of_tenant_link", {
  _landlord_user_id: landlordUserId,
  _tenant_name: profile?.name || user.email || "A tenant",
});
```

The RPC already exists, is `SECURITY DEFINER`, validates the caller is actually linked, writes a row into `notifications` for the landlord, and logs to `activity_logs`. Wrap in try/catch — RPC failure should NOT roll back the link (toast a soft warning instead).

### D. `LandlordLinkCard` status accuracy (small follow-on)

In `src/components/dashboard/LandlordLinkCard.tsx`, also select `verification_status` from `tenants` and show:

- `pending` → amber "Pending Approval" badge instead of green "Connected".
- `approved` (or anything else truthy that currently shows connected) → existing "Connected" UI.

This brings the dashboard card in line with the Settings tab.

---

## Untouched

- `paystack-initiate` / `paystack-webhook` edge functions
- `paystack_transactions`, `rent_records`, `tenants`, `profiles` schemas
- All RLS policies and SECURITY DEFINER functions
- Landlord dashboard, admin flows, marketplace, chat, notifications infra
- Existing Paystack callback handling on dashboard mount

## Warnings

- The notification fix only applies to **new** link attempts. Loise's existing "LND-123456" pending link in the screenshot won't retroactively notify the landlord — she'd need to disconnect and reconnect, or the landlord approves from the Tenants table directly.this should not happen it should notify the landlord no exceptions for any account including the loise account 
- The Cash/Bank Transfer branch in Pay Now requires an existing unpaid `rent_records` row (same precondition as today's Paystack flow). If none exists, the dialog stays disabled with the current "No outstanding rent to pay" toast.
- `LandlordLinkCard` change reads one extra column; no policy change needed since tenants already select their own `tenants` row.