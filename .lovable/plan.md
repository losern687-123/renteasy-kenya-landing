## Goal

Update `supabase/functions/paystack-initiate/index.ts` only — add configurable currency, idempotency guard, and clean error handling. No other files, tables, or functions touched.

## 1. New secret

Add `PAYSTACK_CURRENCY` via the secrets tool (value `KES`). Read in function as:

```ts
const currency = Deno.env.get("PAYSTACK_CURRENCY") ?? "KES";
```

Use it in both the inserted `paystack_transactions` row and the Paystack initialize body, replacing the hardcoded `"KES"`.

## 2. Amount conversion

Keep `amount * 100`. Add a comment:

```ts
// Smallest-unit conversion: KES/NGN/GHS all use *100 (cents/kobo/pesewas).
// If switching to a currency with different minor units, update this.
```

## 3. Idempotency guard

Before inserting the pending row, query for an existing recent pending transaction:

- Same `user_id`
- Same `payment_type`
- Same `metadata` (compared via `.eq("metadata", { ...metadata, payment_type })` — jsonb equality)
- `status = "pending"`
- `created_at > now() - 10 minutes` (computed in JS: `new Date(Date.now() - 10*60*1000).toISOString()`)

If found and the stored `paystack_response.data.authorization_url` exists, return:

```json
{ "authorization_url": "...", "access_code": "...", "reference": "<existing>", "reused": true }
```

If a pending row exists but has no `authorization_url` yet (initialize never completed), treat as not found and proceed normally so the user isn't stuck.

## 4. Clean error handling

On Paystack non-200 or `status === false`:

- `console.error("Paystack initialize failed:", { reference, status: psResp.status, body: psData })`
- Update row to `status = "failed"`, `paystack_response = psData`
- Return 502 with `{ "error": "Payment could not be initiated. Please try again." }` — no raw details leaked.

Also on the pre-existing insert-error path, sanitize: log full error, return generic 500 message.

## 5. Unchanged

- JWT auth via `supabase.auth.getUser(token)` stays — function remains protected.
- `paystack_transactions` schema, RLS, all other tables, all other functions, `paystack-webhook` — untouched.
- `verify_jwt = false` in `config.toml` stays (in-code JWT validation pattern).

## Deliverables after implementation

1. `PAYSTACK_CURRENCY` secret added and read at runtime.
2. Idempotency guard returns existing `authorization_url` for duplicate clicks within 10 minutes.
3. Client receives only `"Payment could not be initiated. Please try again."` on Paystack failures; full details in edge logs.
4. Warnings:
   - jsonb equality on `metadata` requires the client to send identical key order/values. Since the function itself builds `{ ...metadata, payment_type }` consistently, this is fine for same-session retries but won't dedupe if the client changes any metadata field between clicks.
   - If you set `PAYSTACK_CURRENCY` to a currency Paystack doesn't accept for your account, every initialize will fail cleanly with the new generic message — check edge logs to see the underlying Paystack reason.
   - Amount conversion still assumes 2-decimal currencies (KES/NGN/GHS/USD/ZAR). Currencies like JPY or KWD would need a different multiplier.
