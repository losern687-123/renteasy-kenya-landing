# Property Marketplace & Vacancy Management -- Implementation Plan

## Scope Assessment

This is a 40+ hour feature set spanning 7 new database tables, a new user role, public marketplace, real-time chat, vacancy tracking, and photo management. It will be implemented across multiple messages in phases.

---

## Phase 1: Database Foundation (First Implementation)

### New Tables (via migrations)

1. `**property_listings**` -- Marketplace listings linked to `properties.id`
  - id, property_id (FK), landlord_id, title, description, property_type, bedrooms, bathrooms, amenities (jsonb), move_in_date, is_active, views_count, created_at, updated_at
2. `**property_photos**` -- Multiple photos per listing
  - id, listing_id (FK), storage_path, caption, sort_order, is_primary, created_at
3. `**property_inquiries**` -- Seeker applications
  - id, listing_id (FK), seeker_id, landlord_id, message, status (pending/accepted/rejected), created_at, updated_at
4. `**saved_properties**` -- Seeker favorites
  - id, seeker_id, listing_id (FK), created_at
5. `**seeker_documents**` -- ID/payslip uploads
  - id, seeker_id, document_type, storage_path, created_at
6. `**chat_conversations**` -- Seeker-landlord chats
  - id, listing_id, seeker_id, landlord_id, last_message_at, created_at
7. `**chat_messages**` -- Individual messages
  - id, conversation_id (FK), sender_id, content, is_read, created_at

### Extend Existing

- `ALTER TABLE properties ADD COLUMN occupancy_status TEXT DEFAULT 'unknown'`
- `ALTER TABLE properties ADD COLUMN available_for_listing BOOLEAN DEFAULT false`
- Add `'property_seeker'` to the `app_role` enum

### Storage

- Create `property-listing-photos` bucket (public)
- Create `seeker-documents` bucket (private)

### RLS Policies

- Listings: public SELECT for active listings, landlord INSERT/UPDATE/DELETE on own
- Inquiries: seeker INSERT, landlord SELECT on own, seeker SELECT on own
- Saved: seeker full CRUD on own
- Chat: participants only SELECT/INSERT
- Photos: public SELECT for active listings, landlord CRUD on own
- Documents: seeker CRUD on own, admin SELECT all

### Realtime

- Enable on `chat_messages`, `property_inquiries`, `chat_conversations`

---

## Phase 2: Property Seeker Role & Auth

### Files Modified

- `**src/pages/Auth.tsx**` -- Add "Property Seeker" as third role option in registration (alongside Tenant and Landlord). Seeker registration: Name, Email, Phone, Password.
- `**src/hooks/useAuth.tsx**` -- Update `signUp` to handle `property_seeker` role. Update `signIn` to redirect seekers to `/seeker/dashboard`. Add `property_seeker` to type unions.
- `**src/components/RouteGuard.tsx**` -- Add `property_seeker` to allowed role types.
- `**src/hooks/useRoleRedirect.tsx**` -- Add seeker redirect to `/seeker/dashboard`.

### New Files

- `**src/pages/SeekerDashboard.tsx**` -- Dashboard shell with tabs: Browse, Saved, Applications, Documents, Settings.
- `**src/components/seeker/SeekerLayout.tsx**` -- Layout with sidebar matching existing design system.
- `**src/components/seeker/SeekerSidebar.tsx**` -- Navigation sidebar.

### Routes (App.tsx)

```
/seeker/dashboard -- SeekerDashboard (RouteGuard: property_seeker)
/marketplace -- Public marketplace (no auth required)
/marketplace/:id -- Listing detail (no auth required)
```

---

## Phase 3: Vacancy Tracking

### Files Modified

- `**src/components/landlord/PropertiesTable.tsx**` -- Add occupancy status badge column, "Mark Vacant" button.
- `**src/pages/LandlordDashboard.tsx**` -- Add vacancy stats to overview. Quick action: "List Vacant Property".

### New Files

- `**src/components/landlord/VacancyStatusBadge.tsx**` -- Badge component for occupied/vacant/pending status.

### Logic

- When landlord marks property vacant, show prompt: "List on marketplace?"
- When tenant added to property, auto-set occupancy to "occupied" and deactivate any listing.

---

## Phase 4: Listing Creation & Management

### New Files

- `**src/components/landlord/CreateListingForm.tsx**` -- Form that auto-fills from property data, adds description, type, bedrooms, amenities, photo upload.
- `**src/components/landlord/ListingsTable.tsx**` -- Table showing all landlord's listings with status, views, inquiries count.
- `**src/components/landlord/ListingPhotoUpload.tsx**` -- Drag-drop photo upload with reorder, primary selection, captions.

### Files Modified

- `**src/pages/LandlordDashboard.tsx**` -- Add "Marketplace" tab to `renderTabContent()`.
- `**src/components/landlord/LandlordSidebar.tsx**` -- Add "Marketplace" nav item with Store icon.
- `**src/components/landlord/LandlordBottomNav.tsx**` -- Add marketplace to mobile nav.

### Listing Limits

- Tied to existing subscription tier system. Free: 5 listings, Pro: 20, Enterprise: 100, Custom: unlimited.
- Extend `useSubscriptionLimits` to include `listingLimit` and `listingCount`.

---

## Phase 5: Public Marketplace

### New Files

- `**src/pages/marketplace/MarketplacePage.tsx**` -- Public browse page with search, filters (location, price, type, bedrooms), property cards grid, pagination.
- `**src/pages/marketplace/ListingDetailPage.tsx**` -- Full detail page: photo gallery, property details, amenities, landlord info, contact/apply buttons.
- `**src/components/marketplace/PropertyCard.tsx**` -- Card: photo, type, price, location, bedrooms, save button.
- `**src/components/marketplace/SearchFilters.tsx**` -- Filter bar: location dropdown, price range, property type, bedrooms.
- `**src/components/marketplace/PhotoGallery.tsx**` -- Image gallery with thumbnails.

### Routes (App.tsx)

```
/marketplace -- MarketplacePage (public, no auth)
/marketplace/:id -- ListingDetailPage (public, save/apply requires auth)
```

### Navbar Enhancement

- Add "Marketplace" link to main navbar for public access.

---

## Phase 6: Chat System

### New Files

- `**src/components/chat/ChatWindow.tsx**` -- Message list + input, real-time via Supabase channels.
- `**src/components/chat/ConversationList.tsx**` -- List of conversations with unread counts.
- `**src/components/chat/ChatBubble.tsx**` -- Individual message bubble.
- `**src/pages/Chat.tsx**` -- Full chat page (conversations + messages side by side).

### Integration

- "Contact Landlord" on listing detail creates/opens a conversation.
- "Move to WhatsApp" button opens `wa.me/{phone}` with pre-filled message.
- New message notifications use existing notification system (add type `message_received`).
- Unread chat count in notification bell.

### Routes

```
/chat -- Chat page (auth required, seeker or landlord)
/chat/:conversationId -- Specific conversation
```

---

## Phase 7: Inquiry System

### New Files

- `**src/components/marketplace/InquiryForm.tsx**` -- Application form (message, move-in date, documents).
- `**src/components/landlord/InquiriesView.tsx**` -- Landlord view of all inquiries with accept/reject.
- `**src/components/seeker/MyApplications.tsx**` -- Seeker's application tracker.

### Integration

- Inquiry notifications to landlord via existing system.
- Accept inquiry → suggest "Add as Tenant" flow.

---

## Phase 8: Role Transition (Seeker → Tenant)

### New Files

- `**src/components/seeker/BecomeTenantForm.tsx**` -- Enter landlord ID, validate via existing `validate_landlord_id` RPC, add `tenant` role (keep `seeker` role).

### Files Modified

- `**src/hooks/useAuth.tsx**` -- Support dual roles (seeker can also be tenant).
- `**src/components/RoleBasedNav.tsx**` -- Role switcher dropdown when user has multiple roles.

---

## Phase 9: Admin Enhancements

### Files Modified

- `**src/pages/AdminDashboard.tsx**` -- Add marketplace stats (active listings, seekers, inquiries).
- Add admin ability to view/moderate listings and flag inappropriate content.

---

## Implementation Order

Given the dependency chain:

1. **Phase 1** (Database) -- everything depends on this
2. **Phase 2** (Seeker role) -- needed before marketplace features
3. **Phase 4** (Listing creation) -- landlords need to create listings first
4. **Phase 5** (Marketplace browse) -- public facing, depends on listings existing
5. **Phase 3** (Vacancy tracking) -- enhances property management
6. **Phase 6** (Chat) -- depends on listings and seeker role
7. **Phase 7** (Inquiries) -- depends on listings and chat
8. **Phase 8** (Role transition) -- depends on seeker dashboard working
9. **Phase 9** (Admin) -- polish phase

Each phase will be a separate implementation message. Phase 1 (database) is the critical foundation and will be implemented first.

---

## Safeguards

- All existing tables untouched (only ADD columns with defaults)
- All existing routes preserved
- Existing auth flow unchanged for tenant/landlord/admin
- RouteGuard extended, not replaced
- Notification system reused with new types
- Subscription system extended, not replaced
- New components in dedicated directories (`/marketplace/`, `/seeker/`, `/chat/`)

---

## Estimated New Files: ~25

## Estimated Modified Files: ~12

## New Database Tables: 7

## New Storage Buckets: 2  
for property seekers they don't need to be verified by the admin by the admin should still have a tab about them and thier activity in the admin dashboard

&nbsp;