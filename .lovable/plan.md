## Goal

Wire the tenant Paystack payment flow via the existing `paystack-initiate` edge function. Only touch `src/pages/TenantDashboard.tsx` and `src/pages/TenantAddPayment.tsx`. No backend, RLS, edge function, or other-page changes.

## 1. `src/pages/TenantDashboard.tsx`

### Activate Pay Now

- Remove the `disabled` Tooltip wrapper around the Pay Now button.
- On mount (after `user` resolves), fetch the current unpaid/overdue rent context for the dialog:
  - From `rent_records`: latest record where `tenant_id = user.id` and `status != 'Paid'`, ordered by `due_date desc`, limit 1 → gives `id`, `property_name`, `amount`, `due_date`.
  - From `tenants`: `landlord_id` where `id = user.id` (mirrors `LandlordLinkCard`).
  - From `profiles`: `email` of current user (already fetched in notification effect — reuse).
- If no unpaid record exists, the button shows but clicking it shows a Sonner info toast "No outstanding rent to pay" and does not open the dialog.

### Confirmation dialog (shadcn `Dialog`)

Opened from Pay Now. Shows:

- Property name
- Amount due (formatted KES)
- Month being paid for (derived from `due_date` → `MMMM yyyy`)
- Editable email input pre-filled with user email
- "Cancel" + "Proceed to Payment" buttons

### Proceed to Payment

- Local `submitting` state disables the button and shows a `Loader2` spinner.
- Calls:

```ts
supabase.functions.invoke('paystack-initiate', {
  body: {
    payment_type: 'rent',
    amount: Math.round(rentRecord.amount),
    email,
    metadata: {
      tenant_id: user.id,
      landlord_id: tenantLink.landlord_id,
      rent_record_id: rentRecord.id,
    },
  },
});
```

- Success → `window.location.href = data.authorization_url`.
- Error → Sonner `toast.error(data?.error ?? error.message ?? 'Failed to start payment')`, re-enable button. Dialog stays open.
- Missing `landlord_id` → toast: "Link to a landlord before paying rent." Disable Proceed button when prerequisites missing.

### Paystack callback handling

On mount, check `window.location.search` for `reference` or `trxref`. If present:

- Render an overlay/Card "Verifying your payment…" with a spinner for 3000 ms (`setTimeout`).
- After the timeout: bump `refreshKey` (refreshes `RentSummaryCard`, `PaymentHistoryTable`, `RentReminderBanner`, `LandlordLinkCard`), call Sonner `toast.success("Payment received! Your records have been updated.")`, and `window.history.replaceState({}, '', window.location.pathname)` to drop the params so refresh won't re-trigger.
- Implemented with a one-shot `useRef` guard so React StrictMode double-mount doesn't run it twice.

### Toast import

Add `import { toast as sonnerToast } from "sonner"` (the existing `toast` from `@/hooks/use-toast` stays for the refresh notice). Use sonner for the new flow per the spec.

## 2. `src/pages/TenantAddPayment.tsx`

### Add Paystack option

- Add `<SelectItem value="Paystack">Paystack (Online)</SelectItem>` to the existing Select.
- When `payment_method === 'Paystack'`:
  - Hide the receipt upload block entirely.
  - Show inline note: "You will be redirected to Paystack to complete your payment securely."
  - Submit button label becomes "Pay via Paystack".
- Cash / Bank Transfer paths unchanged — same fields, same receipt upload, same insert into `rent_records`.

### Paystack submit branch

In `handleSubmit`, if method is Paystack:

- Skip the receipt upload + `rent_records` insert entirely.
- Look up `tenants.landlord_id` for `user.id`. If null → `toast.error('Link to a landlord before paying via Paystack.')` and stop.
- Create a `pending` `rent_records` row first so we have a `rent_record_id` for metadata:
  - `tenant_id = user.id`, `property_name`, `amount`, `payment_method = 'Paystack'`, `due_date = today`, `status = 'Pending'`. (`receipt_url` null.) The existing webhook flips it to `Paid` on success.
- Invoke `paystack-initiate` with `payment_type: 'rent'`, `amount: Math.round(parseFloat(amount))`, `email: user.email`, `metadata: { tenant_id, landlord_id, rent_record_id }`.
- Success → redirect to `authorization_url`.
- Error → toast the error and leave the form. (The pending rent_record remains; tenants can retry by re-submitting — webhook still references the latest record via metadata id, so a stale pending row is acceptable and matches current "manual record" semantics.)

## 3. Untouched

- All other pages, components, hooks.
- All edge functions including `paystack-initiate` / `paystack-webhook`.
- Every table, RLS policy, SECURITY DEFINER function.
- Cash / Bank Transfer flow (form, receipt upload, DB insert) — same code path.
- Payment history rendering — historical `payment_method` strings keep displaying as-is.

## Deliverables after implementation

1. Pay Now is live on `TenantDashboard` — opens confirmation dialog, calls `paystack-initiate`, redirects to Paystack.
2. `TenantAddPayment` shows Paystack as a third method with hidden receipt + redirect-style submit; Cash/Bank Transfer untouched.
3. Cash and Bank Transfer flows confirmed unchanged (same handler branch).
4. `?reference=` / `?trxref=` callback handled on mount with verifying overlay → success toast → URL cleanup.

## Warnings

- `paystack-initiate` validates `amount` as a positive integer. We round `parseFloat(amount)` to int — fractional KES is dropped. Flag if your rent amounts ever have decimals.
- Paystack callback `reference` is acknowledged but not re-verified client-side; trust comes from the server webhook. If a tenant lands on the dashboard with `?reference=` before the webhook finishes (rare, but possible if webhook is slow or fails), the success toast may show while `status` is still `Pending`. The 3-second delay mitigates but does not eliminate this. Real verification stays server-side.
- If the tenant isn't linked to a landlord, both flows block with a toast — make sure the LandlordLinkCard CTA is reachable so this isn't a dead end.
- Creating a `pending` `rent_records` row up-front in `TenantAddPayment` (Paystack branch) means abandoned payments leave stale Pending rows. Acceptable per current product behavior (manual entry already creates Pending rows), but mention this for cleanup later.
- The new flow assumes `user.email` exists on the auth user. If a tenant signed up without an email (shouldn't happen with current auth setup), the dialog's email field will be empty and they'll need to type one in.
