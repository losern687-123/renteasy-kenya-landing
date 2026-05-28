# Realignment Plan

Five themed workstreams. Each is independent and shippable on its own.

---

## 1. Property-level link codes (replaces single Landlord ID for tenants)

**Problem today:** tenant enters `LND-XXXXXX` → gets attached to a landlord but to no property → landlord sees the tenant floating with no unit → rent can't be recorded → the system feels broken. The landlord-wide code also makes no sense alongside the landlord-adds-tenant flow.

**New model:**

- Each `properties` row gets its own unique code `PROP-XXXXXX` (auto-generated, like `LND-` is today).
- Properties also gain `property_type` (1BR / 2BR / Studio / Bedsitter / House) and `capacity` (max tenants), so landlords describe the unit and its rent up-front.
- Tenant Settings stops asking for Landlord ID — it asks for **Property Code**.
- A new RPC `validate_property_code(code)` returns `{ valid, landlord_id, property_id, property_name, rent_amount }`.
- Linking writes `tenants.property_id` and `tenants.landlord_id` in one step, status `pending`, and notifies the landlord (existing notification function, updated message to include property name).
- Landlord dashboard groups tenants under each property card, so approvals and rent recording happen in-context.

**Migration touches:** add `property_code`, `property_type`, `capacity` to `properties`; backfill codes for existing rows; new SECURITY DEFINER RPC; tighten `tenants` RLS (tenant can only self-link if `property_id` matches a real property under the resolved landlord).

**The old `LND-XXXXXX**` stays on the profile (used by the marketplace and admin), but is no longer the tenant-linking mechanism.

---

## 2. Rent setup per property (landlord side)

When a landlord adds a property, the form captures: name, location, **property type**, **bedrooms**, **bathrooms**, **capacity**, **monthly rent**, and a short description. The wizard in §4 owns this UI.

Listing cards on the marketplace already pull from `properties` + `property_listings`; we surface `property_type` and `capacity` on the public card so seekers see "2BR · sleeps 4 · KES 25,000/mo" at a glance.

---

## 3. Tenant payments + printable receipt

After any successful payment (Paystack callback verifies on dashboard mount; cash/bank flips status when landlord confirms), the matching `rent_records` row becomes "paid" and a **Receipt** button appears next to it.

Clicking it opens a clean printable receipt (`/tenant/receipt/:id`) with:

- Tenant name, property name, landlord name
- Amount, payment method (M-Pesa / Card / Bank / Cash via Paystack channel), reference, date
- "Print" and "Download PDF" buttons (`window.print()` + `react-to-print` style page)

No new tables — receipt reads from `rent_records` + `paystack_transactions`.

---

## 4. Landlord property-posting wizard (multi-step)

Replaces the current two-form flow (AddProperty → CreateListing) with one wizard that always creates the internal property and optionally publishes it to the marketplace.

```text
Step 1 — Basics       name, location, type, bedrooms, bathrooms, capacity
Step 2 — Pricing      monthly rent (KES), deposit, available-from date
Step 3 — Photos       drag-and-drop upload (existing ListingPhotoUpload)
Step 4 — Amenities    chip multi-select (existing list) + short description
Step 5 — Publish      toggle: "Keep internal only" / "Publish to marketplace"
                      → on submit: writes properties row + property_code,
                        and (if toggled) property_listings + photos
```

Progress bar at top, "Back / Continue" footer, validation per step, draft state held in component (no DB drafts). On finish → toast with the new **Property Code** so the landlord can hand it to tenants immediately.

---

## 5. Visual refresh — Ocean Deep, depth level 3

Update `index.css` design tokens (HSL):

```text
--primary       210 67% 15%   (#0c2340 deep navy)
--primary-glow  198 56% 39%   (#2d8a9e teal)
--accent        178 41% 55%   (#5cbdb9 soft teal)
--secondary     208 60% 27%   (#1a4a6e mid navy)
--background    210 40% 98%   (cool white)
--sidebar       210 67% 11%   (deeper than primary)
```

Depth 3 visual moves:

- Card surfaces: subtle 1px border + `--shadow-md`; hover lifts to `--shadow-lg` with 150ms ease.
- Hero blocks on Landing, Dashboards, Marketplace get a single soft `--gradient-hero` (navy → teal) — used sparingly, never on cards.
- KPI numbers in **Manrope** (display), body stays Inter.
- Marketplace listing detail page gets a redesigned card: large photo gallery left, sticky info column right (price, type, capacity, amenities chips, Save + Inquire CTAs). Amenities grouped: "Inside the home", "Building & security", "Outdoor".
- Dashboards: stat cards gain an accent icon disk (teal tint), section headers get a thin teal underline.
- Motion: keep current Framer transitions, add a 200ms stagger on dashboard card grids.

Memory update: replace the "SaaS aesthetic / Forest Green / no gradients" rule with the Ocean Deep rule.

---

## Order of execution

1. **Migration** (§1 + §2 schema) — property code, type, capacity, RPC.
2. **Wizard** (§4) — new posting flow uses the new fields.
3. **Tenant linking rewrite** (§1) — Property Code input, landlord dashboard regroups tenants under properties.
4. **Receipts** (§3) — receipt route + print button on paid rows.
5. **Visual refresh** (§5) — tokens, hero gradient, listing detail redesign, sidebar restyle.

---

## What I left out (confirm before I proceed)

- You didn't list Landlord or Seeker issues, and didn't dictate wizard steps. I proposed defaults above (5-step wizard, group-by-property on landlord dashboard, seeker flow untouched). Tell me if any of that should change.
- Receipts will print to PDF via the browser print dialog. If you want server-generated PDFs (emailed via Resend), say so — that's an edge-function add.
- Old landlord-wide `LND-XXXXXX` codes stay valid for admin/marketplace identity but are no longer used for tenant linking.On the issue of seekers transtioning to tenants they should make use of the linkcode of the specific property they are going to shared by their [landlord.In](http://landlord.In) terms of UI we need to make it more visually appealing and have a more modern approach to the design and not make it look like basic AI slop.Remove any iteration of the old landlord tenant linking code so as to make for a smoother transtion to the new plan easier 