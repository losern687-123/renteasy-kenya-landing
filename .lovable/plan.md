
# Bug Fixes Plan - RLS Policies & Foreign Keys

## Issues Identified

### Issue 1: "Failed to load applications" on Admin Landlords Page
**Root Cause**: The `AdminLandlords.tsx` page (line 59-68) queries:
```javascript
.select(`*, profiles (name, email)`)
```
This JOIN requires a **foreign key relationship** between `landlord_applications.user_id` and `profiles.id`, but `landlord_applications.user_id` only references `auth.users(id)`, not `profiles.id`.

**Solution**: Add a foreign key from `landlord_applications.user_id` to `profiles.id` to enable the PostgREST join.

---

### Issue 2: "Invalid landlord ID" on Tenant Settings Page  
**Root Cause**: Looking at the network request flow:
1. **Profile lookup succeeds** (Status 200): The query `profiles?landlord_id=eq.LND-123456` returns the landlord profile correctly
2. **Role check succeeds**: The landlord role is found
3. **Application check succeeds** (for landlord f7bbf6f7): Status is 'approved'
4. **INSERT INTO tenants fails**: No RLS policy allows tenants to INSERT their own connection

The `tenants` table only has INSERT policies for landlords:
```sql
CREATE POLICY "Landlords can insert their own tenants"
  WITH CHECK (has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());
```

There's **NO policy** for tenants to create their own connection record.

**Solution**: Add RLS policies for tenants to manage their own connection:
- INSERT: Tenants can insert their own connection (id = auth.uid())
- SELECT: Tenants can view their own connection record
- UPDATE: Tenants can update their own connection record

---

### Issue 3: Missing Foreign Key for SubscriptionTable JOIN
The `SubscriptionTable.tsx` (line 43) queries:
```javascript
.select(`*, landlord:profiles!landlord_id(name, email), tier:subscription_tiers(*)`)
```
This requires FK from `landlord_subscriptions.landlord_id` to `profiles.id` - **this exists** from migration.

---

## Database Migration Required

```sql
-- ========================================
-- Fix Issue 1: Add FK for landlord_applications to profiles
-- ========================================

-- Add foreign key constraint from landlord_applications.user_id to profiles.id
-- This enables PostgREST joins with profiles table
ALTER TABLE public.landlord_applications
ADD CONSTRAINT fk_landlord_applications_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ========================================
-- Fix Issue 2: Add RLS policies for tenants to self-connect
-- ========================================

-- Policy 1: Allow tenants to INSERT their own connection request
-- This enables the flow in TenantSettings.tsx where a tenant enters LND-XXXXXX
CREATE POLICY "Tenants can insert their own connection"
  ON public.tenants
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 2: Allow tenants to SELECT their own record
-- This enables checking verification_status
CREATE POLICY "Tenants can view their own connection"
  ON public.tenants
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: Allow tenants to UPDATE their own record
CREATE POLICY "Tenants can update their own connection"
  ON public.tenants
  FOR UPDATE
  USING (auth.uid() = id);
```

---

## Security Analysis

### Tenant Self-Connection Policies - SECURE because:
1. **`auth.uid() = id`** - Tenants can ONLY insert/select/update records where the `id` matches their auth user ID
2. **Landlord UUID is set from verified profile lookup** - The `landlord_id` comes from querying the profiles table with the verified `landlord_id` string (LND-XXXXXX)
3. **Landlord verification is checked** - Code checks `landlord_applications.status = 'approved'` before allowing connection
4. **No cross-tenant access** - Each tenant can only access their own connection record

### Foreign Key Addition - SAFE because:
1. This only adds referential integrity
2. Data already exists and is valid (user_id values in landlord_applications already match profiles.id)
3. ON DELETE CASCADE is appropriate - if profile deleted, application should be too

---

## Implementation Phases

### Phase 1: Database Migration (5 min)
Apply the SQL migration to add:
- Foreign key constraint on landlord_applications
- 3 new RLS policies on tenants table

### Phase 2: Verification Testing (10 min)
Test the following flows:
1. Admin Landlords page loads applications correctly
2. Tenant can enter LND-123456 and connect successfully
3. Tenant can see their connection status (pending/verified)
4. Landlord can see self-connected tenants in dashboard

---

## Files Changed

| Type | File/Table | Change |
|------|------------|--------|
| Database | `landlord_applications` | Add FK to `profiles.id` |
| Database | `tenants` | Add 3 RLS policies for tenant self-connection |

---

## Expected Results After Fix

### Admin Landlords Page
- Applications load correctly with name and email from profiles
- No "Failed to load applications" error

### Tenant Settings Page  
- Entering valid LND-123456 creates connection request
- Success toast: "Connection request sent to landlord"
- Status shows "pending" after connection
- No "Invalid landlord ID" error for valid landlord IDs

### Landlord Dashboard
- Self-connected tenants appear in tenant list
- Status shows as "pending verification"
- Landlord can verify/reject tenant connections

---

## Success Criteria

- [ ] Admin can view all landlord applications with profiles joined
- [ ] Tenant can enter LND-XXXXXX and successfully create connection
- [ ] Tenant can view their connection status
- [ ] Landlord sees self-connected tenants
- [ ] No RLS policy violations in network requests
- [ ] No console errors during the flows
