

# Hotfix Plan: Registration, Redirect, and Admin Workflow Fixes

## Root Cause Analysis

After thorough investigation of the code and database, here are the **5 distinct bugs** causing all the issues:

### Bug 1: Double Navigation on Login (Auth.tsx)
When a user logs in, **two** navigation functions fire simultaneously:
- `signIn()` in useAuth.tsx navigates after 500ms delay
- `redirectBasedOnRole()` in Auth.tsx fires immediately after signIn returns

`redirectBasedOnRole()` uses `.single()` on `landlord_applications`, which throws an error if no row exists, sending landlords to `/apply-as-landlord`. Then 500ms later, `signIn` navigates again -- causing a race condition and broken redirect.

**Fix**: Remove the `redirectBasedOnRole()` call after successful `signIn()` in Auth.tsx since `signIn` already handles navigation.

### Bug 2: Tenant Settings Landlord Connection Fails (TenantSettings.tsx)
The "Landlord Connection" tab in tenant settings queries `landlord_applications` directly to check if a landlord is approved. However, **RLS policies only allow users to see their own applications**. A tenant cannot read another user's application row, so the query silently returns no data and shows "Invalid landlord ID."

**Fix**: Replace the direct table queries with the `validate_landlord_id` RPC function (already exists and works -- confirmed by database test returning `valid: true` for LND-205001).

### Bug 3: Admin Tenants Page Query Fails (AdminTenants.tsx)
The admin tenants page joins tenants to profiles using `profiles!tenants_landlord_id_fkey`, but **this foreign key does not exist**. The only FK on tenants is `tenants_property_id_fkey` (to properties). This causes the "Failed to load tenants" error shown in the screenshot.

**Fix**: Either add the missing FK via migration, or change the query to use a subquery/manual join approach.

### Bug 4: useRoleRedirect Uses .single() Instead of .maybeSingle()
When `redirectBasedOnRole` checks landlord application status, it uses `.single()` which throws an error if no row exists. For new landlords whose application row might be missing, this causes a redirect to `/apply-as-landlord` instead of `/landlord/pending`.

**Fix**: Change to `.maybeSingle()` and handle the null case by redirecting to `/landlord/pending`.

### Bug 5: signIn in useAuth.tsx Uses .single() for Application Check
Similar to Bug 4, the `signIn` function queries `landlord_applications` with `.single()`. If the query fails (no row), the landlord gets no redirect at all.

**Fix**: Change to `.maybeSingle()` and default missing applications to `pending` status.

---

## Implementation Steps

### Step 1: Database Migration -- Add Foreign Key on tenants.landlord_id
Add a FK from `tenants.landlord_id` to `profiles.id` so the admin tenants query can use a proper join.

```sql
ALTER TABLE public.tenants
ADD CONSTRAINT tenants_landlord_id_fkey
FOREIGN KEY (landlord_id) REFERENCES public.profiles(id);
```

### Step 2: Fix Auth.tsx -- Remove Double Navigation
Remove the `redirectBasedOnRole()` call after successful `signIn()` (lines 122-124). The `signIn` function already handles role-based navigation internally.

### Step 3: Fix useRoleRedirect.tsx -- Use .maybeSingle()
Change `.single()` to `.maybeSingle()` on line 48 and handle the case where no application exists by redirecting to `/landlord/pending`.

### Step 4: Fix useAuth.tsx signIn -- Use .maybeSingle()
In the `signIn` function, change the `landlord_applications` query to use `.maybeSingle()` and default to `pending` status when no row exists.

### Step 5: Fix TenantSettings.tsx -- Use validate_landlord_id RPC
Replace the direct queries to `profiles`, `user_roles`, and `landlord_applications` in `handleLandlordConnect` with the secure `validate_landlord_id` RPC that bypasses RLS.

### Step 6: Fix AdminTenants.tsx -- Use Correct FK Name
Update the join to use the new FK name `tenants_landlord_id_fkey`.

---

## Technical Details

### Files to Modify
1. **src/pages/Auth.tsx** -- Remove `redirectBasedOnRole()` after signIn (3 lines)
2. **src/hooks/useRoleRedirect.tsx** -- `.single()` to `.maybeSingle()`, handle null (5 lines)
3. **src/hooks/useAuth.tsx** -- Fix `.single()` in signIn to `.maybeSingle()`, default to pending (3 lines)
4. **src/pages/TenantSettings.tsx** -- Replace direct queries with RPC call in handleLandlordConnect (~30 lines)
5. **src/pages/AdminTenants.tsx** -- Fix FK reference in query (1 line)
6. **Database migration** -- Add FK constraint on tenants.landlord_id

### Testing Protocol
After implementation, I will run browser-based E2E tests:
1. Register a new landlord and verify redirect to `/landlord/pending`
2. Log in as admin and verify the landlord application appears
3. Approve the landlord and verify LND-XXXXXX ID is generated
4. Log in as the approved landlord and verify dashboard access
5. Register a tenant with the landlord ID and verify it works
6. Test the tenant settings landlord connection with LND-205001
7. Verify admin tenants page loads without errors

