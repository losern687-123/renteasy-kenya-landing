## Goal
Regenerate the RentEasy Kenya platform summary as a shorter PDF (target: 2 pages) with a two-column layout — a narrow left **sidebar** containing a quick-reference summary, and a wider right column with the main content.

## Layout

```text
┌────────────┬───────────────────────────────┐
│  SIDEBAR   │   MAIN CONTENT                │
│ (≈30%)     │   (≈70%)                      │
│            │                               │
│ Project    │   Overview                    │
│ At a Glance│   Roles & Access              │
│            │   Core Features               │
│ Key Stats  │   Payments & Subscriptions    │
│            │   Security                    │
│ Tech Stack │                               │
│ (compact)  │   Tech Stack (detailed)       │
│            │                               │
│ Roles      │                               │
└────────────┴───────────────────────────────┘
```

## Sidebar contents (condensed bullets)
- **Project**: RentEasy Kenya — multi-tenant rent SaaS
- **Roles**: Admin · Landlord · Tenant · Seeker
- **Stack**: React 18, TS, Vite, Tailwind, shadcn, Supabase, Deno edge funcs
- **Integrations**: M-Pesa Daraja, Resend, WhatsApp
- **Security**: RLS, SECURITY DEFINER, role table
- **Edge functions**: 8 (mpesa-stk-push, mpesa-callback, approve-landlord, notify-landlord, check-subscription-limits, send-rent-reminder, send-waitlist-email)

## Main content (compressed to ~2 pages)
1. **Overview** — 2–3 sentences
2. **Roles & Auth** — short paragraph + bullets
3. **Features by role** — Tenant / Landlord / Seeker / Admin (one tight bullet list each)
4. **Payments & Subscriptions** — M-Pesa flow + 4-tier system in 4–5 bullets
5. **Security highlights** — 4 bullets
6. **Tech stack** — frontend / backend / integrations grouped

## Technical approach
- Python + `reportlab` using `BaseDocTemplate` with two `Frame`s per page (sidebar + main) inside a single `PageTemplate`.
- Brand color `#0C4A3E` (Forest Green) for sidebar background and headings.
- Output: `/mnt/documents/RentEasy_Kenya_Platform_Summary_v2.pdf` (keep v1 intact).
- QA: render pages with `pdftoppm` and visually inspect for overflow, clipping, contrast.
- Emit `<presentation-artifact>` tag pointing to the new file.

## Out of scope
No app code changes — this is a one-off document generation task.
