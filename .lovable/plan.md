## Goal

Add Paystack payment processing for rent, subscription upgrades, and landlord verification fees — without touching any existing edge function, table, RLS policy, or SECURITY DEFINER function.

## 1. Database migration

**New table: `paystack_transactions**`

- `id` uuid PK
- `reference` text unique (Paystack reference)
- `user_id` uuid (the authenticated caller)
- `payment_type` text — check constraint: `rent` | `subscription` | `verification`
- `amount` integer (KES, whole units — kobo conversion happens in the function)
- `currency` text default `KES`
- `status` text — check constraint: `pending` | `success` | `failed`, default `pending`
- `metadata` jsonb
- `paystack_response` jsonb
- `created_at`, `updated_at` timestamptz

Note: will NOT use `REFERENCES auth.users(id)` per project rules (no FKs to auth.users). `user_id` stays as a plain uuid populated from `request.auth.user.id`.

**RLS on `paystack_transactions`:**

- SELECT: `user_id = auth.uid() OR has_role(auth.uid(), 'admin')`
- INSERT: `with check (true)` — only edge functions (service role) will write; anon/auth clients are blocked because they cannot satisfy a sensible insert path (we'll narrow to `auth.uid() = user_id` to be safe, but service role bypasses RLS regardless)
- UPDATE: restricted to admins only at RLS level; the webhook uses the service role key and bypasses RLS

**New column on `profiles`:**

- `verification_fee_paid` boolean default false

**Untouched:** every existing table, every RLS policy on existing tables, every SECURITY DEFINER function, every trigger.

## 2. Edge function: `paystack-initiate`

Path: `supabase/functions/paystack-initiate/index.ts`

Flow:

1. CORS preflight handling.
2. Extract bearer token from `Authorization` header, call `supabase.auth.getUser(token)` using the anon key client to resolve the caller. Reject with 401 if missing/invalid. **The user id always comes from this lookup — never from the request body.**
3. Validate body with Zod:
  - `payment_type` ∈ `rent | subscription | verification`
  - `amount` positive integer
  - `email` valid email
  - `metadata` object with the required keys per type:
    - rent → `tenant_id`, `landlord_id`, `rent_record_id`
    - subscription → `landlord_id`, `tier`
    - verification → `landlord_id`
4. Generate `reference = crypto.randomUUID()`.
5. Insert a `pending` row into `paystack_transactions` (service role) with `user_id` from JWT, the validated payload, and an empty `paystack_response`.
6. POST to `https://api.paystack.co/transaction/initialize` with:
  - `Authorization: Bearer PAYSTACK_SECRET_KEY`
  - body: `{ email, amount: amount * 100, currency: "KES", reference, metadata: { ...metadata, payment_type, user_id } }`
7. If Paystack returns non-success → update the row to `failed`, store the response, return 502.
8. On success → store the Paystack response on the row and return `{ authorization_url, access_code, reference }`.

`verify_jwt = false` in `config.toml` (auth is validated in-code per project convention).

## 3. Edge function: `paystack-webhook`

Path: `supabase/functions/paystack-webhook/index.ts`

Flow:

1. **Always** return `200 OK` after processing — even for unhandled events or non-fatal errors — so Paystack does not retry.
2. Read raw body as text (needed for signature validation).
3. Verify `x-paystack-signature` using HMAC-SHA512 of the raw body with `PAYSTACK_SECRET_KEY`. Reject with 401 if mismatch (this is the only non-200 response).
4. Parse JSON. If `event !== "charge.success"` → return 200 immediately.
5. Look up `paystack_transactions` by `data.reference`. If missing → log + return 200.
6. Update that row: `status = "success"`, `paystack_response = data`.
7. Branch on `payment_type` from the stored metadata:
  - **rent**: update `rent_records` where `id = metadata.rent_record_id`:
    - `status = "Paid"` (matches existing enum-style values used in the app)
    - `payment_method = "Paystack"`
    - `payment_date = today`
    - `receipt_url = data.reference` (stored as the Paystack reference for traceability — generic field already in the table)
  - **subscription**: upsert/update `landlord_subscriptions` for `landlord_id` — set `tier_id` to the tier matching `metadata.tier` (looked up in `subscription_tiers` by `name`), `status = "active"`, refresh `start_date`/`end_date`. Also insert a `subscription_payments` row tying the payment to the subscription.
  - **verification**: update `profiles.verification_fee_paid = true` where `id = metadata.landlord_id`.
8. Insert an `activity_logs` entry: `action = "paystack_payment_received"`, `entity_type = payment_type`, `entity_id` = the relevant record id, `details` = `{ reference, amount, payment_type, metadata }`. `user_id` = the transaction's `user_id`.
9. All DB operations use the service role client.

`verify_jwt = false` in `config.toml` (webhook is signed by Paystack, not by a Supabase JWT).

## 4. `supabase/config.toml`

Add:

```
[functions.paystack-initiate]
verify_jwt = false

[functions.paystack-webhook]
verify_jwt = false
```

## 5. Secrets

`PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` — confirm with you before deploy. They are not in the current secrets listing, so I will request them via the secrets tool before writing the functions.

## 6. Deploy

Deploy both functions immediately after creation using the deploy tool so they're live.

## 7. Final deliverables I'll give you after implementation

1. Confirmation both functions deployed.
2. Webhook URL to register in Paystack dashboard:
  `https://zwewwdqjvauissxzojgi.supabase.co/functions/v1/paystack-webhook`
3. Confirmation `paystack_transactions` exists with RLS enabled + `profiles.verification_fee_paid` column added.
4. Manual checks:
  - Register the webhook URL above in your Paystack dashboard and enable the `charge.success` event.
  - Confirm `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` are the **live** keys (or test keys if you're still in sandbox).
  - The rent flow currently has a disabled "Pay Now" button — wiring the frontend to call `paystack-initiate` and redirect to `authorization_url` is **not** in this scope (you said do not touch UI beyond what was already changed). Tell me when you want that wired up.
  - `subscription_tiers.name` is used to resolve `metadata.tier` → tier id. Make sure callers pass the tier `name` (`free`, etc.), not the display name.

## Question before I start

The plan adds a new column to `profiles` (`verification_fee_paid`) and writes to `landlord_subscriptions` + `subscription_payments` from the webhook. Both are existing tables but the writes are additive (no schema/RLS changes on them). Confirm that "do not alter existing tables beyond `verification_fee_paid`" means schema-only — webhook **data writes** to `rent_records`, `landlord_subscriptions`, `subscription_payments`, `activity_logs`, and `profiles` are expected, right?I have to secret keys and public api keys for test mode for paystack provide me a place where to input them as well