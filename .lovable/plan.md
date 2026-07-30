## Where things stand (verified against the live backend today)

Backend is healthy: database and connection pooler up, 0 restarts, 48% memory, 3% disk, 6/60 connections, 14.9 MB of data. The monthly rent cron job (`generate-monthly-rent-job`, runs 02:00 on the 1st) is registered and active.

## Workflow-by-workflow

**1. Signup and roles — working.** Signup writes a profile and a role row via a database trigger. Roles live in their own table (tenant / landlord / admin / property_seeker) and route guards read from it.

**2. Landlord verification — working.** Landlord signup creates a pending application; admin approves via the `approve-landlord` function; approved landlords reach the dashboard, others land on pending/rejected screens. 5 applications exist.

**3. Property posting (5-step wizard) — working.** Each property gets a `PROP-XXXXXX` code. Only 1 property and 0 marketplace listings exist so far, so this path is effectively untested with real volume.

**4. Tenant links to a property by code — working.** Tenant Settings validates the code, creates the tenant row, notifies the landlord, and shows "pending approval" until the landlord confirms.

**5. Seeker upgrades to tenant — BROKEN.** `BecomeTenantCard` reads `landlord_id` from the validation response, but the function returns that field as `landlord_user_id`. The value is always undefined, so the tenant row insert fails and the seeker can never upgrade. Tenant Settings uses the correct field name — only the seeker card is wrong.

**6. Rent records and payments — working but inconsistent.** Manual recording, Paystack checkout, webhook confirmation, and receipts all function. The webhook verifies the Paystack signature, is idempotent, and writes an audit log. Problem: the monthly cron inserts rent rows with status `"pending"` in lowercase while the whole app and the database guard trigger use title-case `"Paid" / "Pending" / "Unpaid" / "Overdue"`. Auto-generated invoices will therefore behave unpredictably in status filters and badges. Nothing marks an unpaid record `Overdue` after the due date — that status exists in the UI but is never set.

**7. Subscriptions — working.** Paystack webhook cancels the old subscription, inserts the new one, records the payment, and updates the tier. No subscriptions exist yet, so it is untested against real traffic.

**8. Notifications, chat, marketplace, audit logs — working.** In-app notifications, conversations, listings, and the admin audit page with date/action filters all operate as built.

## What I would fix, in priority order

1. **Seeker to tenant upgrade** — correct the field name so the insert succeeds; add an error surface so a failure is visible rather than silent.
2. **Rent status casing** — make the cron function insert `"Unpaid"` and normalize any existing lowercase rows, so generated invoices flow through the same filters as manual ones.
3. **Overdue marking** — extend the monthly job (or add a small daily job) to flip unpaid records past their due date to `Overdue`, so tenants and landlords see accurate state.
4. **Duplicate database function** — two versions of the landlord-notify function exist (2-argument and 3-argument). Overloads like this can make the API pick the wrong one; drop the obsolete 2-argument version and point the signup path at the current one.
5. **Guard rails on linking** — prevent a second active tenant row for the same person, and give a clear message when a code belongs to an unapproved landlord.
6. **End-to-end pass** — drive the browser through seeker upgrade, tenant link, landlord approval, invoice generation, and a Paystack callback to confirm each step after the fixes.

## Keeping the backend running 24/7

The hosted backend is always-on — it does not sleep on idle, and only stops if it is manually paused. Practical steps to keep it that way:

- **Do not pause it** unless you intend to; it can be resumed on request.
- **Scheduled jobs** run inside the database, so invoices and reminders fire whether or not anyone has the app open. Worth adding a small run-log so a silently failed month is visible.
- **Capacity**: current usage is comfortable (48% memory, 3% disk). If memory or connections climb, the instance size can be increased from Cloud settings; disk is a separate control.
- **Monitoring**: I can add a lightweight admin health panel showing last cron run, failed payment webhooks, and stuck pending links, so breakdowns surface before users report them.

&nbsp;

Another thing to add is that I can't enter the Admin portal thanks to the new changes to the UI find a way to place the admin portal some where where only I can access it 

&nbsp;

## Technical notes

- Fix in `src/components/seeker/BecomeTenantCard.tsx`: use `landlord_user_id` from `validate_property_code`.
- Fix in `supabase/functions/generate-monthly-rent/index.ts`: insert `status: "Unpaid"`; pin the client import to an `npm:` specifier for consistency with the other functions.
- Migration: drop the 2-argument `notify_landlord_of_tenant_link` overload; add a partial unique index preventing duplicate active tenant links; backfill lowercase rent statuses.
- No changes to Paystack functions, RLS policies, or the design system.
  &nbsp;