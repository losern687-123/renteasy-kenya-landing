# Maintenance, Maps, Messaging & Multi-Contact

Built in one pass, on top of the existing Noir & Gold design system. No contractor accounts or contractor network — assignment is landlord-only ("I'll handle it" / "assigned to someone"), per your answer. Emergencies notify by email + in-app, plus a one-tap WhatsApp escalation for the landlord.

## 1. Delete a property (from the screenshot)

- Each card in "My Properties" gets a **Delete** action with a confirm dialog.
- Delete is blocked with a clear explanation when the property still has linked tenants, rent history, or a live marketplace listing — the dialog names what's blocking it and links to the right tab ("2 tenants linked — unlink them first", "listed on marketplace — unlist first").
- When nothing is attached, the property and its property code are removed permanently.

## 2. Maintenance & utility tracking

New "Maintenance" section for landlords and tenants.

**Tenant — Report an Issue**
- Button on the tenant dashboard opens a form: issue type (Plumbing, Electrical, Appliance, Heating, Structural, Other), description, 1–3 photos, severity, and a location note ("bathroom, under sink") with an optional pin on the property map.
- On submit: request created as **Open**, confirmation shown, and a maintenance thread opens automatically containing the photos, description and a system message "Maintenance request created".
- Free-tier tenants can always report (unlimited), with 1 photo and no severity selector.

**Landlord — Schedule Maintenance** (Pro/Enterprise)
- Create a task against a property: title, type, description, severity, target date.
- Dashboard list with severity-first ordering, status filters, and per-property grouping. Emergency items are pinned at the top and can't be dismissed until actioned.

**Status workflow**
Open → Assigned → In Progress → On Hold (with reason) → Completed, plus Cancelled (with reason). Every transition writes a system message into the thread and notifies the other party. Completion requires at least one completion photo, then the tenant is asked for a 1–5 star rating with a comment.

**Cost tracking (Pro+)**: quoted vs actual cost, receipt upload, payment status.

**Analytics**: Pro sees issues per month and average resolution time over 6 months; Enterprise sees 12+ month trends, recurring-issue detection per property, and cost-per-property ROI. Bulk task creation is Enterprise-only.

**Tier gating**
- Free: tenant reporting + thread + status visibility + rating. Severity, task creation, costs and analytics show as locked cards with "Upgrade to unlock".
- Pro: everything above, full severity + workflow + costs + 6-month analytics.
- Enterprise: bulk task creation, 12-month analytics, recurring-issue insights, warranty notes.

## 3. OpenStreetMap location intelligence

Uses OpenStreetMap tiles with Nominatim for address search and Overpass for nearby amenities — no paid map key needed.

- **Property wizard**: address autocomplete, auto-geocode to coordinates, a verification map with a draggable pin, and fallbacks (click the map, or enter coordinates manually, or skip and add later). Saves coordinates + formatted address + neighbourhood.
- **Marketplace**: map thumbnail on each card, a "View on Map" full-screen view with nearby hospitals, schools, transport, shops and banks (each with distance), address, and a "Get Directions" link. A List/Map toggle shows all listings on one map with the existing filters applied and clickable pins that preview a listing.
- **Landlord property map**: all properties on one map, colour-coded — occupied, vacant, under maintenance, has pending issues. Clicking a pin shows status, tenant name, rent status and open-issue count with a "View details" link.
- **Maintenance pins**: the exact spot for an issue is stored with the request and shown to the people on that thread only.
- Seeker location filters: "within X km of…" search plus radius filtering on the map view.

## 4. Unified messaging

- One **Messages** hub listing maintenance threads and marketplace conversations together, with search across message text and unread badges.
- Real-time delivery, read receipts, typing indicators, photo/video/document attachments, pinned messages, timestamps, and a participant list.
- Automatic system messages for every status change, assignment, work start, photo upload and completion.
- History window follows the tier: Free = current month, Pro = 6 months, Enterprise = full history. Older messages show an upgrade prompt rather than disappearing silently.
- Users can delete their own messages (rendered as "[deleted]"); system messages can't be deleted.

## 5. WhatsApp + multi-contact

- **Landlord settings**: phone, WhatsApp number, email, per-field "visible to seekers" toggles, preferred contact method, and privacy options (hide phone, logged-in users only). Defaults: email and WhatsApp visible, phone hidden, preferred = WhatsApp.
- **Listing page**: contact buttons for WhatsApp (deeplink with a pre-filled message naming the property and address), Email (pre-filled composer), Call (only when the landlord made the number visible), and Message in RentEasy. The preferred method is highlighted.
- Every contact click is recorded so the landlord can see which channel seekers actually use.
- On an emergency maintenance request, the landlord's alert includes a one-tap WhatsApp link so they can reach a plumber/electrician immediately, while all updates stay documented in the thread.

## Privacy and access rules

- Tenants see only their own requests; landlords see requests for their own properties; admins see all. Seekers see nothing about maintenance.
- Maintenance photos and receipts go in a private bucket, readable only by the thread participants.
- Landlord phone numbers are never exposed unless that landlord opted in; nothing contact-related is readable by unauthenticated visitors beyond what they already opt to publish.
- Maintenance coordinates are readable only by thread participants; property coordinates are public for active listings only.

## Technical notes

- New tables: `maintenance_requests`, `maintenance_messages`, `maintenance_attachments`, `maintenance_ratings`, `contact_click_events`; new columns on `properties` (`latitude`, `longitude`, `formatted_address`, `neighbourhood`) and `profiles` (`phone`, `whatsapp_number`, visibility flags, `preferred_contact_method`). Every new public table gets explicit GRANTs plus RLS scoped by role and participation, and a `has_maintenance_access(request_id)` security-definer helper to avoid recursive policies.
- Private storage bucket `maintenance-media` with participant-scoped policies.
- Maps via `react-leaflet` + Leaflet, OSM raster tiles, Nominatim geocode/reverse-geocode and Overpass amenity queries proxied through an edge function (`geo-lookup`) so requests are debounced, cached and rate-limit friendly.
- Notifications reuse the existing `notifications` table and Resend edge function; new `maintenance-notify` function handles email fan-out and severity routing.
- Realtime messaging via Supabase Realtime on `maintenance_messages` and `chat_messages`; typing indicators via presence channels.
- Tier gating reuses `useSubscriptionLimits` with new feature keys, rendered through the existing `LockedFeatureCard`.
- New UI lives under `src/components/maintenance/*`, `src/components/maps/*`, `src/components/contact/*`, with routes added for `/landlord/maintenance`, `/tenant/maintenance`, and the marketplace map view.
