## Goal
Strip all M-Pesa/Daraja integration from the platform while keeping payment history, manual payment recording, and every other workflow fully intact.

## 1. Edge functions to delete
- `supabase/functions/mpesa-stk-push/` (also undeploy)
- `supabase/functions/mpesa-callback/` (also undeploy)
- Remove their entries from `supabase/config.toml`

## 2. Database migration
Drop the M-Pesa-only `mpesa_payments` table (it stores `checkout_request_id`, `merchant_request_id`, `mpesa_receipt_number`, `result_desc` — all exclusively M-Pesa). Cascade-drop its RLS policies.

Keep `rent_records` intact:
- Keep the `payment_method` column (it's a generic enum-style text holding "Cash" / "Bank Transfer" / "M-Pesa") so historical records stay readable.
- Keep `receipt_url` (generic, will be reused for Paystack).

Do NOT touch any other table, RLS policy, or SECURITY DEFINER function.

## 3. UI changes

**Delete**
- `src/components/dashboard/MpesaPaymentModal.tsx`

**Modify**
- `src/pages/TenantDashboard.tsx` — remove `MpesaPaymentModal` import/state and replace the "Pay via M-Pesa" button with a disabled "Pay Now" button that has a tooltip "Payment processing coming soon".
- `src/pages/TenantAddPayment.tsx` — remove the `MpesaPaymentModal` import/state, remove the M-Pesa branch in `handleSubmit`, remove the `M-Pesa` `<SelectItem>`, default `payment_method` to `Cash`, and always show the receipt-upload field. Manual recording remains fully functional.
- `src/components/dashboard/AddPaymentForm.tsx` — audit and strip any M-Pesa default/option (keep manual flow).
- `src/pages/TenantHistory.tsx` — change the `|| "M-Pesa"` fallbacks to `|| "—"` so old records still render but no M-Pesa branding leaks in.
- `src/components/TrustSignals.tsx` — remove "M-PESA" from the partner list.

**Replacement button spec**
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span tabIndex={0}>
        <Button disabled size="lg" className="w-full sm:w-auto">
          <CreditCard className="mr-2 h-5 w-5" /> Pay Now
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent>Payment processing coming soon</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## 4. Storage
Keep the `payment-receipts` bucket and its policies as-is (will be reused for Paystack). No changes needed.

## 5. Untouched (per your rules)
Auth, RBAC, RLS policies on remaining tables, SECURITY DEFINER functions (`has_role`, `notify_landlord_of_tenant_link`, `validate_landlord_id`, etc.), landlord verification, tenant linking, admin console, subscriptions, notifications, activity logs, audit logs, chat, marketplace, properties, and the `payment-receipts` bucket.

## Final summary I will deliver after implementation
1. Files/functions deleted (the 2 edge functions, `MpesaPaymentModal.tsx`, `mpesa_payments` table)
2. Files modified (TenantDashboard, TenantAddPayment, AddPaymentForm if needed, TenantHistory, TrustSignals, config.toml)
3. Confirmation manual payment recording (Cash / Bank Transfer with optional receipt upload) still works end-to-end through `rent_records`
4. Manual checks to perform: verify landlord "Record Payment" form still works, verify payment history shows old M-Pesa records with method label preserved, confirm no broken imports, and revoke Daraja API credentials on Safaricom side (the `MPESA_*` secrets in the backend can be deleted from Cloud settings once you confirm).
