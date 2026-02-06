

# Analytics Dashboard + Password Reset + Sidebar Navigation - Implementation Plan

## Overview
This plan transforms the landlord dashboard with professional sidebar navigation, adds comprehensive tiered analytics, implements secure password reset functionality, and fixes the landlord ID connection issue on the tenant side.

---

## Critical Bug Fix: Landlord ID Connection Issue

### Problem Identified
From the screenshots and code analysis:
- **Landlord Dashboard** displays `landlord_id` format: `LND-123456` (10 characters)
- **Tenant Settings** expects `landlord_code` format: 8 alphanumeric characters (e.g., `B3F2A1C5`)
- These are **two different fields** causing tenant-landlord connection to fail

### Solution
Unify on `landlord_id` (LND-XXXXXX format) for all connections:
1. Update `TenantSettings.tsx` landlord connection to use `landlord_id` instead of `landlord_code`
2. Change validation from 8 characters to LND-XXXXXX format
3. Query `profiles.landlord_id` column instead of `landlord_code`

---

## Part 1: Sidebar Navigation Restructure

### New Layout Structure
```text
Desktop (>=1024px):
+------------------+-----------------------------------+
| SIDEBAR (260px)  |  CONTENT AREA                    |
| - Logo           |  - Breadcrumb                    |
| - User Avatar    |  - Page Title                    |
| - Tier Badge     |  - Tab Content                   |
| - Nav Items      |                                  |
| - Logout         |                                  |
+------------------+-----------------------------------+

Tablet (768-1023px):
+-----------------------------------+
| HEADER [Hamburger Menu]           |
+-----------------------------------+
| CONTENT AREA                      |
| (Sidebar in Sheet)                |
+-----------------------------------+

Mobile (<768px):
+-----------------------------------+
| HEADER                            |
+-----------------------------------+
| CONTENT AREA                      |
+-----------------------------------+
| BOTTOM NAV BAR                    |
+-----------------------------------+
```

### New Sidebar Navigation Tabs
1. **Overview** - Dashboard home (LayoutDashboard icon)
2. **Analytics** - NEW Charts & insights (BarChart3 icon)
3. **Properties** - Property management (Building2 icon)
4. **Tenants** - Tenant management (Users icon)
5. **Payments** - Payment tracking (CreditCard icon)
6. **Reports** - NEW Downloads/exports (FileText icon)
7. **Notifications** - Notifications view (Bell icon)
8. **Settings** - Profile & subscription (Settings icon)

### Components to Create
- `src/components/landlord/LandlordSidebar.tsx` - Professional sidebar with user info
- `src/components/landlord/LandlordLayout.tsx` - Responsive layout wrapper
- `src/components/landlord/LandlordBottomNav.tsx` - Mobile bottom navigation

### Files to Modify
- `src/pages/LandlordDashboard.tsx` - Replace tab-based layout with sidebar layout

---

## Part 2: Analytics Dashboard (NEW Tab)

### Feature Gating by Subscription Tier

**Free Tier (5 properties, 10 tenants)**:
- Current month total revenue (number only)
- Total properties and tenants count
- Last 7 days payment list (simple table)
- Payment success rate (this month only)
- Locked feature previews with upgrade prompts

**Pro Tier (20 properties, 100 tenants)**:
All Free features PLUS:
- 6-month revenue trend line chart
- Monthly collections vs expected bar chart
- Outstanding balance tracker
- Payment method breakdown pie chart
- On-time vs late payment trends
- Property performance comparison
- Next 3 months revenue projection
- CSV/Excel export

**Enterprise Tier (100 properties, 500 tenants)**:
All Pro features PLUS:
- 12+ month historical data
- Year-over-year comparisons
- Occupancy analytics
- Tenant retention & churn analysis
- Advanced forecasting (12 months)
- PDF reports with charts
- Custom date range selection

### Analytics Page Layout
```text
+--------------------------------------------------+
| Analytics Dashboard                               |
| [Date Range Selector] [Export Button - Pro+]     |
+--------------------------------------------------+
| [KPI Card] [KPI Card] [KPI Card] [KPI Card]      |
| Revenue    Collection Outstanding Avg Days       |
+--------------------------------------------------+
| +-------------------+ +-------------------+       |
| | Revenue Trend     | | Payment Status    |       |
| | (Line Chart)      | | (Pie Chart)       |       |
| +-------------------+ +-------------------+       |
+--------------------------------------------------+
| +-------------------+ +-------------------+       |
| | Property Perf     | | Collection Rate   |       |
| | (Bar Chart)       | | (Gauge)           |       |
| +-------------------+ +-------------------+       |
+--------------------------------------------------+
| [Locked Features - Upgrade Prompts]              |
+--------------------------------------------------+
```

### Components to Create
- `src/components/landlord/analytics/AnalyticsDashboard.tsx` - Main analytics container
- `src/components/landlord/analytics/AnalyticsKPICards.tsx` - Stat cards row
- `src/components/landlord/analytics/RevenueChart.tsx` - Line chart for revenue trend
- `src/components/landlord/analytics/PaymentStatusChart.tsx` - Pie chart for payment breakdown
- `src/components/landlord/analytics/PropertyPerformanceChart.tsx` - Bar chart comparison
- `src/components/landlord/analytics/CollectionGauge.tsx` - Gauge for collection rate
- `src/components/landlord/analytics/LockedFeatureCard.tsx` - Upgrade prompt card
- `src/hooks/useAnalyticsData.ts` - Hook to fetch analytics with tier-based filtering

### Data Queries
Calculate from existing tables:
- Revenue: `SUM(rent_records.amount) WHERE status = 'paid'`
- Outstanding: `SUM(rent_records.amount) WHERE status IN ('pending', 'overdue')`
- Collection Rate: `(Paid / Expected) * 100`
- Late Payments: `COUNT(*) WHERE payment_date > due_date`

---

## Part 3: Reports Tab (NEW)

### Report Types by Tier

**All Tiers**:
- Payment history (CSV)
- Tenant list (CSV)
- Property list (CSV)

**Pro Tier**:
- Date range selection
- Rent roll report
- Outstanding balances report
- Excel format exports

**Enterprise Tier**:
- All Pro reports
- Custom report builder
- PDF reports with charts

### Reports Tab Layout
```text
+----------------------------------------+
| Reports & Exports                       |
+----------------------------------------+
| Quick Reports                           |
| +-------------+ +-------------+         |
| | Payment     | | Tenant      |         |
| | History     | | List        |         |
| | [Download]  | | [Download]  |         |
| +-------------+ +-------------+         |
+----------------------------------------+
| Custom Reports (Pro+)                   |
| [Date Range] [Report Type] [Generate]   |
+----------------------------------------+
| Recent Downloads                        |
| - report_2025_01.csv (2 days ago)       |
+----------------------------------------+
```

### Components to Create
- `src/components/landlord/reports/ReportsTab.tsx` - Reports container
- `src/components/landlord/reports/QuickReportCard.tsx` - Download card
- `src/components/landlord/reports/CustomReportBuilder.tsx` - Pro+ builder
- `src/utils/reportGenerators.ts` - CSV/Excel export functions

---

## Part 4: Password Reset Functionality

### Password Reset Flow
```text
1. Login Page -> "Forgot Password?" link
2. ForgotPasswordPage -> Enter email -> Submit
3. Supabase sends reset email
4. User clicks link -> ResetPasswordPage
5. Validate token -> Enter new password
6. Password updated -> Redirect to login
```

### Password Requirements (existing in codebase)
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Components to Create
- `src/pages/ForgotPassword.tsx` - Email entry form
- `src/pages/ResetPassword.tsx` - New password form with strength indicator
- `src/components/auth/PasswordStrengthIndicator.tsx` - Visual strength meter
- `src/components/auth/PasswordRequirements.tsx` - Checklist component

### Files to Modify
- `src/pages/Auth.tsx` - Add "Forgot Password?" link (replace "Coming soon")
- `src/App.tsx` - Add routes for `/forgot-password` and `/reset-password`

### Supabase Integration
Use built-in `supabase.auth.resetPasswordForEmail()` - no custom tokens needed:
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

---

## Part 5: Enhanced Settings Tab

### Current Features (preserve)
- Profile management
- Theme settings
- Notification preferences
- Password change
- Logout

### New Additions
- Link to subscription management
- Account security section:
  - Last login timestamp
  - Password change reminder
- Data export option (GDPR compliance)

---

## Part 6: Overview Tab Reorganization

### Overview Tab Contents
1. Welcome banner with date
2. Subscription overview card (existing)
3. Quick stats row (4 cards)
4. Recent activity (last 10 payments)
5. Quick action buttons
6. Landlord ID display with copy

---

## Database Changes

### No New Tables Required
All analytics data calculated from existing tables:
- `rent_records` - Payment data
- `properties` - Property data
- `tenants` - Tenant data
- `profiles` - User data

### Optional: Analytics Cache Table (if performance needed)
```sql
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  period TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(landlord_id, metric_type, period)
);
```
Note: Only implement if analytics queries become slow

---

## File Creation Summary

| File | Purpose |
|------|---------|
| `src/components/landlord/LandlordSidebar.tsx` | Sidebar navigation |
| `src/components/landlord/LandlordLayout.tsx` | Responsive layout |
| `src/components/landlord/LandlordBottomNav.tsx` | Mobile bottom nav |
| `src/components/landlord/analytics/AnalyticsDashboard.tsx` | Analytics container |
| `src/components/landlord/analytics/AnalyticsKPICards.tsx` | Stats cards |
| `src/components/landlord/analytics/RevenueChart.tsx` | Revenue line chart |
| `src/components/landlord/analytics/PaymentStatusChart.tsx` | Payment pie chart |
| `src/components/landlord/analytics/PropertyPerformanceChart.tsx` | Property bar chart |
| `src/components/landlord/analytics/CollectionGauge.tsx` | Collection gauge |
| `src/components/landlord/analytics/LockedFeatureCard.tsx` | Upgrade prompt |
| `src/components/landlord/reports/ReportsTab.tsx` | Reports container |
| `src/components/landlord/reports/QuickReportCard.tsx` | Report download cards |
| `src/hooks/useAnalyticsData.ts` | Analytics data hook |
| `src/utils/reportGenerators.ts` | Export utilities |
| `src/pages/ForgotPassword.tsx` | Password reset request |
| `src/pages/ResetPassword.tsx` | New password entry |
| `src/components/auth/PasswordStrengthIndicator.tsx` | Strength meter |
| `src/components/auth/PasswordRequirements.tsx` | Requirements list |

## File Modifications

| File | Changes |
|------|---------|
| `src/pages/LandlordDashboard.tsx` | Restructure with sidebar layout, add new tabs |
| `src/pages/TenantSettings.tsx` | Fix landlord connection to use `landlord_id` |
| `src/pages/Auth.tsx` | Add working "Forgot Password?" link |
| `src/App.tsx` | Add routes for password reset and new landlord tabs |

---

## Implementation Order

### Phase 1: Fix Critical Bug (30 min)
1. Update `TenantSettings.tsx` landlord connection logic
2. Change validation to accept LND-XXXXXX format
3. Query correct column (`landlord_id`)
4. Test connection flow

### Phase 2: Password Reset (1.5 hours)
1. Create `ForgotPassword.tsx` page
2. Create `ResetPassword.tsx` page with strength indicator
3. Create helper components
4. Update `Auth.tsx` with link
5. Add routes
6. Test entire flow

### Phase 3: Sidebar Navigation (2 hours)
1. Create `LandlordSidebar.tsx` component
2. Create `LandlordLayout.tsx` wrapper
3. Create `LandlordBottomNav.tsx` for mobile
4. Restructure `LandlordDashboard.tsx`
5. Test responsive behavior

### Phase 4: Overview Tab (1 hour)
1. Reorganize overview content
2. Add recent activity section
3. Add quick actions
4. Test layout

### Phase 5: Analytics Infrastructure (1 hour)
1. Create `useAnalyticsData.ts` hook
2. Set up data fetching with tier filtering
3. Create analytics page shell

### Phase 6: Analytics Charts - Free Tier (1.5 hours)
1. Create KPI cards component
2. Create basic stats display
3. Create locked feature cards
4. Test with free tier

### Phase 7: Analytics Charts - Pro/Enterprise (2 hours)
1. Create revenue trend chart
2. Create payment status pie chart
3. Create property performance bar chart
4. Create collection gauge
5. Test tier-based feature gating

### Phase 8: Reports Tab (1.5 hours)
1. Create reports container
2. Implement CSV export
3. Add date range selection (Pro+)
4. Test downloads

### Phase 9: Settings Enhancement (30 min)
1. Add subscription link
2. Add security section
3. Test all settings

### Phase 10: Testing & Polish (2 hours)
1. Full landlord flow testing
2. Password reset testing
3. Mobile responsive testing
4. Cross-browser testing
5. Error handling verification

---

## Technical Details

### Tier Detection
Use existing `useSubscriptionLimits` hook:
```typescript
const { tierName, features } = useSubscriptionLimits();

const canAccessProFeatures = ['pro', 'enterprise', 'custom'].includes(tierName);
const canAccessEnterpriseFeatures = ['enterprise', 'custom'].includes(tierName);
```

### Chart Library
Use existing Recharts (already in dependencies):
- `LineChart` for revenue trends
- `PieChart` for payment breakdown
- `BarChart` for property comparison

### Export Functions
```typescript
// CSV Export
function exportToCSV(data: any[], filename: string) {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${filename}.csv`);
}
```

---

## Estimated Implementation Time
- Critical Bug Fix: 30 minutes
- Password Reset: 1.5 hours
- Sidebar Navigation: 2 hours
- Overview Tab: 1 hour
- Analytics Infrastructure: 1 hour
- Analytics Charts: 3.5 hours
- Reports Tab: 1.5 hours
- Settings Enhancement: 30 minutes
- Testing & Polish: 2 hours

**Total: ~13.5 hours** (can be done over 2-3 days)

---

## Success Criteria

### Landlord ID Bug Fix
- [ ] Tenants can enter LND-XXXXXX format in settings
- [ ] Connection to landlord works correctly
- [ ] No confusion between landlord_code and landlord_id

### Sidebar Navigation
- [ ] Professional sidebar on desktop
- [ ] Hamburger menu on tablet
- [ ] Bottom nav on mobile
- [ ] All tabs accessible
- [ ] Smooth transitions

### Analytics Dashboard
- [ ] Free tier sees basic metrics + upgrade prompts
- [ ] Pro tier sees full charts
- [ ] Enterprise tier sees advanced analytics
- [ ] Charts responsive on all screen sizes
- [ ] Export functionality works

### Password Reset
- [ ] "Forgot Password?" link works
- [ ] Email sent successfully
- [ ] Reset link validates correctly
- [ ] Password strength indicator works
- [ ] Successful reset redirects to login

### Reports
- [ ] Basic exports work for all tiers
- [ ] Date range selection works (Pro+)
- [ ] Files download correctly

