

# Hotfix Plan: Registration, Routing, and Admin Realtime Fixes

## Summary of Changes

Seven targeted fixes to restore all workflows: simplify landlord registration (National ID only, no KRA pin), remove landlord ID from tenant registration, fix tenant-landlord connection in dashboard, add realtime to admin dashboard, fix misrouted accounts, and remove KRA pin references from admin views.

---

## Step 1: Database -- Enable Realtime + Fix Orphaned Accounts

**Migration**: Enable realtime on `landlord_applications` table so admin receives new applications instantly.

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.landlord_applications;
```

**Data fix (insert tool)**: Find landlord-role accounts missing `landlord_applications` rows and insert pending records so they route correctly.

---

## Step 2: Fix Auth.tsx -- Registration Form Changes

1. **Remove Landlord ID field from tenant registration** (lines 203-220). Tenants register with just Name, Email, Password. They connect to landlord later from dashboard.
2. **Add National ID field for landlord registration**. When role is `landlord`, show a "National ID Number" input field (mock verification).
3. **Remove landlord ID validation from `validateInputs`** (lines 74-90). No more `landlordIdSchema` check during signup.
4. **Update `signUp` call** -- pass `nationalId` instead of `landlordId` for landlords; no `landlordId` for tenants.
5. **Remove `validateLandlordId` function** and `isValidatingLandlord` state (no longer needed at registration).
6. **Remove `useRoleRedirect` import** -- not needed since signIn handles navigation.

---

## Step 3: Fix useAuth.tsx -- SignUp Logic

1. **Remove tenant-landlord linking at registration** (lines 142-168). Tenants no longer provide a landlord ID at signup. They just get a profile and role.
2. **Use `nationalId` for landlord application insert** instead of hardcoded 'PENDING'. Remove `kra_pin` field (set to empty string since column is required).

```typescript
// Landlord signup: create application with provided National ID
if (role === 'landlord') {
  await supabase.from('landlord_applications').insert({
    user_id: data.user.id,
    national_id: nationalId || 'PENDING',
    kra_pin: '',  // Removed from flow
    status: 'pending'
  });
}
```

3. **Update signUp signature** to accept `nationalId` instead of `linkedLandlordId`.

---

## Step 4: Fix useRoleRedirect.tsx -- Tenant Route

Line 36 navigates tenants to `/tenant/dashboard` but App.tsx has it at `/tenant-dashboard`. Fix to use `/tenant-dashboard` for consistency (both routes exist but the primary is `/tenant-dashboard`).

---

## Step 5: Fix Admin Dashboard + AdminLandlords -- Realtime + Remove KRA PIN

**AdminDashboard.tsx**:
1. Add realtime subscription to `landlord_applications` table so new applications appear instantly without refresh.
2. Remove "KRA PIN" column from all three tabs (pending, approved, rejected).
3. Replace with "National ID" column only.

**AdminLandlords.tsx**:
1. Add realtime subscription.
2. Remove KRA PIN column from table header and rows.

---

## Step 6: Fix Tenant-Landlord Connection in TenantSettings.tsx

The `handleLandlordConnect` function already uses `validate_landlord_id` RPC and works correctly. The issue is the `loadMyLandlordCode` function (lines 183-213) which queries `landlord_code` (a deprecated field) and shows the wrong UI for tenants. Fix:

1. Remove the `loadMyLandlordCode` function and `myLandlordCode` state -- tenants should not see a landlord code section.
2. The landlord connection tab should only show the connection form for tenants who are not yet connected, or show "Connected" status for those who are.

---

## Step 7: Fix Misrouted Accounts via Data Insert

Query all users with `landlord` role who lack a `landlord_applications` record. Insert pending application rows for each, ensuring they get routed to `/landlord/pending` instead of tenant dashboard.

---

## Files Modified

1. **src/pages/Auth.tsx** -- Remove landlord ID from tenant form, add National ID for landlords, remove validation
2. **src/hooks/useAuth.tsx** -- Update signUp signature/logic, remove tenant linking at registration
3. **src/hooks/useRoleRedirect.tsx** -- Fix tenant route path
4. **src/pages/AdminDashboard.tsx** -- Add realtime subscription, remove KRA PIN columns
5. **src/pages/AdminLandlords.tsx** -- Add realtime subscription, remove KRA PIN columns
6. **src/pages/TenantSettings.tsx** -- Fix landlord connection tab, remove deprecated landlord_code logic
7. **Database** -- Enable realtime on landlord_applications, insert missing application records

