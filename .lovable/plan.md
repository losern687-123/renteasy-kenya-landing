
# Subscription Tiers & Monetization System - Implementation Plan

## Overview
This plan implements a complete subscription tier system for RentEasy Kenya with 4 pricing tiers (Free, Pro, Enterprise, Custom), feature gating based on subscription level, and full admin management capabilities.

---

## Phase 1: Database Schema

### New Tables to Create

**Table 1: subscription_tiers**
- Stores the 4 pricing tier definitions
- Fields: id, name (unique slug), display_name, description, price_monthly, price_annual, max_properties (nullable for unlimited), max_tenants (nullable for unlimited), features (JSONB), is_active, sort_order, created_at, updated_at

**Table 2: landlord_subscriptions**
- Tracks active subscription for each landlord
- Fields: id, landlord_id (FK to profiles), tier_id (FK to subscription_tiers), status (active/cancelled/expired/trial), billing_cycle (monthly/annual), start_date, end_date, trial_ends_at, auto_renew, created_at, updated_at
- Unique constraint on landlord_id (one active subscription per landlord)

**Table 3: subscription_payments**
- Payment transaction history
- Fields: id, subscription_id (FK), landlord_id, amount, currency (default KES), payment_method, payment_reference, status (pending/completed/failed/refunded), payment_date, period_start, period_end, metadata (JSONB), created_at

**Table 4: subscription_requests**
- For upgrade requests (pre-payment integration)
- Fields: id, landlord_id, requested_tier_id, phone_number, billing_cycle, company_name, status (pending/contacted/completed/rejected), admin_notes, created_at, updated_at

### Schema Modification
- Add `current_tier` column to profiles table (defaults to 'free')

### Seed Data
Insert 4 default tiers:
1. **Free**: KES 0, 5 properties, 10 tenants, basic features
2. **Pro**: KES 3,999/month (KES 39,999/year), 20 properties, 100 tenants, advanced features
3. **Enterprise**: KES 12,999/month (KES 129,999/year), 100 properties, 500 tenants, premium features
4. **Custom**: Contact sales, unlimited everything

---

## Phase 2: Security (RLS Policies)

### subscription_tiers
- SELECT: Anyone can view active tiers (for pricing display)

### landlord_subscriptions
- SELECT: Users view own subscription + Admins view all
- INSERT/UPDATE: Admins only

### subscription_payments
- SELECT: Users view own payments + Admins view all
- INSERT: Admins only

### subscription_requests
- SELECT: Users view own requests + Admins view all
- INSERT: Authenticated users (landlords) can create
- UPDATE: Admins only

---

## Phase 3: Edge Function

### check-subscription-limits
**Purpose**: Server-side validation of subscription limits before property/tenant creation

**Input**: landlord_id, limit_type ('properties' | 'tenants')

**Returns**:
```json
{
  "tier_name": "free",
  "display_name": "Free",
  "limit": 5,
  "current_count": 3,
  "can_add": true,
  "is_unlimited": false
}
```

**Logic**:
1. Fetch landlord's active subscription
2. If none exists, default to free tier
3. Count current properties/tenants
4. Return limit info and whether addition is allowed

---

## Phase 4: Frontend Components

### New Components to Create

**src/components/subscription/SubscriptionBadge.tsx**
- Tier badge with icon and color coding
- Props: tier ('free'|'pro'|'enterprise'|'custom'), size ('sm'|'md'|'lg')
- Colors: Free=gray, Pro=blue, Enterprise=purple, Custom=amber
- Icons: Sparkles, Zap, Building, Crown (from lucide-react)

**src/components/subscription/PricingCard.tsx**
- Full pricing card for a single tier
- Shows: badge, price (with annual savings), limits, features checklist
- "Most Popular" badge for Pro tier
- Current tier indicator (highlighted border, disabled button)
- Upgrade button or "Contact Sales" for custom

**src/components/subscription/SubscriptionOverviewCard.tsx**
- Compact dashboard widget showing current plan
- Visual progress bars for property/tenant usage
- Color-coded: green (<70%), yellow (70-90%), red (>90%)
- Quick action buttons: "Upgrade Plan", "View Details"

**src/components/subscription/UpgradeModal.tsx**
- Modal overlay with all 4 tiers in grid
- Billing cycle toggle
- Request form (phone, billing preference)
- Success confirmation after submission

**src/components/subscription/LimitAlert.tsx**
- Inline alert banner when limits are reached
- Shows current usage and upgrade CTA

**src/components/admin/SubscriptionAnalytics.tsx**
- Stats cards: MRR, ARR, Free vs Paid ratio, Conversion Rate, ARPU

**src/components/admin/SubscriptionTable.tsx**
- Table with all landlord subscriptions
- Columns: Name, Email, Tier, Status, Billing, Dates, MRR
- Filters, search, pagination, export

**src/components/admin/SubscriptionCharts.tsx**
- Pie chart: Tier distribution
- Line chart: Revenue trend (12 months)
- Bar chart: Upgrade/downgrade activity

---

## Phase 5: New Pages

**src/pages/SubscriptionSettings.tsx**
- Full subscription management page for landlords
- Billing cycle toggle
- 4 pricing cards grid
- Current subscription details
- Payment history table

**src/pages/admin/AdminSubscriptions.tsx**
- Admin subscription management page
- Analytics cards at top
- Charts section
- Full subscription table with actions

---

## Phase 6: Custom Hook

**src/hooks/useSubscriptionLimits.ts**
```typescript
interface SubscriptionLimits {
  tierName: string;
  displayName: string;
  propertyLimit: number | null;
  tenantLimit: number | null;
  propertyCount: number;
  tenantCount: number;
  canAddProperty: boolean;
  canAddTenant: boolean;
  features: string[];
  isLoading: boolean;
}
```
- Uses React Query for caching (5 min stale time)
- Defaults to free tier if no subscription found
- Calculates usage percentages for progress bars

---

## Phase 7: Integration Points

### Landlord Dashboard Modifications
**File: src/pages/LandlordDashboard.tsx**
1. Add SubscriptionOverviewCard prominently in Overview tab (after landlord ID card)
2. Display usage metrics with progress bars
3. Add "Upgrade Plan" button that opens UpgradeModal

### Property Creation Limit Check
**File: src/components/landlord/AddPropertyForm.tsx**
1. Use useSubscriptionLimits hook
2. Before form submit, check canAddProperty
3. If limit reached: show LimitAlert, disable submit button
4. Show usage indicator: "3/5 properties"

### Tenant Creation Limit Check
**File: src/components/landlord/AddTenantForm.tsx**
1. Same pattern as property limits
2. Check canAddTenant before allowing creation
3. Show appropriate alerts and upgrade prompts

### Routing
**File: src/App.tsx**
- Add route: `/landlord/subscription` -> SubscriptionSettings
- Add route: `/admin/subscriptions` -> AdminSubscriptions

### Navigation Updates
**File: src/components/admin/AdminSidebar.tsx**
- Add "Subscriptions" menu item with CreditCard icon
- Position after Payments

**File: src/pages/LandlordDashboard.tsx**
- Add "Plan & Billing" option in mobile menu
- Show tier badge in menu

---

## Phase 8: Payment Request Flow (Pre-Registration)

Since payment integration isn't live yet:

1. User clicks "Upgrade" on any paid tier
2. UpgradeModal opens with request form
3. Form collects: phone number, preferred billing cycle
4. Submits to subscription_requests table
5. Shows success: "Our team will contact you within 24 hours"
6. Admin can view/manage requests in admin panel

---

## Technical Details

### Database Migration SQL
```sql
-- Create subscription tier enum isn't needed, using text with constraints

-- Table 1: Subscription Tiers
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_annual NUMERIC NOT NULL DEFAULT 0,
  max_properties INTEGER,
  max_tenants INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: Landlord Subscriptions
CREATE TABLE landlord_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT DEFAULT 'monthly',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(landlord_id)
);

-- Table 3: Subscription Payments
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES landlord_subscriptions(id),
  landlord_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  period_start DATE,
  period_end DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 4: Subscription Requests
CREATE TABLE subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requested_tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,
  phone_number TEXT NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  company_name TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add current_tier to profiles
ALTER TABLE profiles ADD COLUMN current_tier TEXT DEFAULT 'free';

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Seed default tiers
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_annual, max_properties, max_tenants, features, sort_order) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0, 5, 10, '["Basic property management", "Up to 5 properties", "Up to 10 tenants", "Email support"]', 1),
('pro', 'Pro', 'For growing landlords', 3999, 39999, 20, 100, '["Everything in Free", "Up to 20 properties", "Up to 100 tenants", "Priority email support", "Payment reminders", "Basic analytics"]', 2),
('enterprise', 'Enterprise', 'For property managers', 12999, 129999, 100, 500, '["Everything in Pro", "Up to 100 properties", "Up to 500 tenants", "Phone support", "Advanced analytics", "Custom reports", "API access"]', 3),
('custom', 'Custom', 'Tailored for your needs', 0, 0, NULL, NULL, '["Everything in Enterprise", "Unlimited properties", "Unlimited tenants", "Dedicated account manager", "Custom integrations", "SLA guarantee"]', 4);
```

### RLS Policies SQL
```sql
-- subscription_tiers: Anyone can view active tiers
CREATE POLICY "Anyone can view active tiers" ON subscription_tiers
  FOR SELECT USING (is_active = true);

-- landlord_subscriptions policies
CREATE POLICY "Users can view own subscription" ON landlord_subscriptions
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all subscriptions" ON landlord_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions" ON landlord_subscriptions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions" ON landlord_subscriptions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- subscription_payments policies
CREATE POLICY "Users can view own payments" ON subscription_payments
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all payments" ON subscription_payments
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payments" ON subscription_payments
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- subscription_requests policies
CREATE POLICY "Users can view own requests" ON subscription_requests
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Users can create requests" ON subscription_requests
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all requests" ON subscription_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests" ON subscription_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));
```

---
On top of all of this the unique id for landlords that is the generated id example lnd-1234 is not able to fit the scope given on the tenant side so the tenant cannot be immediately attached to their specific landlord look into that as well 
## File Creation Summary

| File | Purpose |
|------|---------|
| src/components/subscription/SubscriptionBadge.tsx | Tier badge component |
| src/components/subscription/PricingCard.tsx | Single tier pricing card |
| src/components/subscription/SubscriptionOverviewCard.tsx | Dashboard widget |
| src/components/subscription/UpgradeModal.tsx | Upgrade request modal |
| src/components/subscription/LimitAlert.tsx | Limit reached alert |
| src/components/admin/SubscriptionAnalytics.tsx | Admin stats cards |
| src/components/admin/SubscriptionTable.tsx | Admin subscriptions table |
| src/components/admin/SubscriptionCharts.tsx | Admin charts |
| src/pages/SubscriptionSettings.tsx | Landlord subscription page |
| src/pages/admin/AdminSubscriptions.tsx | Admin subscriptions page |
| src/hooks/useSubscriptionLimits.ts | Subscription limits hook |
| supabase/functions/check-subscription-limits/index.ts | Limit validation function |

## File Modifications

| File | Changes |
|------|---------|
| src/pages/LandlordDashboard.tsx | Add subscription overview card |
| src/components/landlord/AddPropertyForm.tsx | Add limit checking |
| src/components/landlord/AddTenantForm.tsx | Add limit checking |
| src/components/admin/AdminSidebar.tsx | Add Subscriptions nav item |
| src/App.tsx | Add new routes |
| supabase/config.toml | Add edge function config |

---

## Estimated Implementation Time
- Database Setup: 20 minutes
- Security Policies: 15 minutes  
- Edge Function: 15 minutes
- Core UI Components: 45 minutes
- Landlord Pages: 40 minutes
- Admin Components: 60 minutes
- Custom Hook: 20 minutes
- Limit Integration: 45 minutes
- Routing & Navigation: 20 minutes
- Testing & Polish: 45 minutes

**Total: ~5 hours**
