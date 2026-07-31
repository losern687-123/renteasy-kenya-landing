import type { TierValue } from "@/components/marketing/sections";

export interface ProductContent {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  emphasis: string;
  hero: string;
  metaTitle: string;
  metaDescription: string;
  image: "rent" | "interior" | "estate";
  benefits: { title: string; text: string }[];
  features: { title: string; text: string; badge?: string }[];
  useCases: { label: string; quote: string; author: string }[];
  availability: { feature: string; free: TierValue; pro: TierValue; enterprise: TierValue }[];
  faqs: { q: string; a: string }[];
}

export const products: ProductContent[] = [
  {
    slug: "rent-tracking",
    name: "Rent Tracking & Payments",
    eyebrow: "Rent Tracking",
    headline: "Every shilling of rent,",
    emphasis: "accounted for",
    hero: "Invoices raised automatically each month, payments collected online through Paystack, and receipts issued the moment money lands.",
    metaTitle: "Rent Tracking & Online Payments | RentEasy Kenya",
    metaDescription:
      "Automate monthly rent invoices, collect online payments through Paystack, and issue instant receipts for every Kenyan tenant you manage.",
    image: "rent",
    benefits: [
      { title: "Automatic invoicing", text: "A scheduled job raises rent records for every active tenancy on the first of the month — nothing to remember." },
      { title: "Online collection", text: "Tenants pay by card, bank or mobile money through Paystack checkout and the record updates itself." },
      { title: "Instant receipts", text: "Every confirmed payment produces a downloadable receipt tenants can keep for their records." },
      { title: "Manual entry kept", text: "Cash or bank transfer still happens. Landlords can record those payments by hand in seconds." },
      { title: "Overdue visibility", text: "Unpaid invoices past their due date flip to Overdue so nothing quietly slips through." },
      { title: "Verified confirmations", text: "Payment webhooks are signature-verified and idempotent, so a record is never double-credited." },
    ],
    features: [
      { title: "Monthly rent generation", text: "Scheduled generation of Unpaid invoices per tenancy, based on the rent amount and due day on the tenant record." },
      { title: "Paystack checkout", text: "One-tap payment from the tenant dashboard with a confirmation step and automatic return handling." },
      { title: "Payment history", text: "Filterable history per tenant and per property with status, method and payment date." },
      { title: "Receipts", text: "Per-payment receipt pages with property, period, amount and reference, ready to print or save." },
      { title: "Landlord confirmation", text: "Landlords confirm off-platform payments and the tenant sees the update immediately." },
      { title: "Reminders", text: "Rent reminder emails to nudge tenants before and after the due date.", badge: "Paid" },
    ],
    useCases: [
      { label: "Small landlord", quote: "I stopped chasing five tenants over WhatsApp every month. The invoices go out on their own and I only look at what's unpaid.", author: "Owner, 5 units — Kilimani" },
      { label: "Growing portfolio", quote: "Three buildings, one screen. I can tell you in ten seconds who has paid and who hasn't.", author: "Landlord, 34 units — Westlands" },
      { label: "Tenant", quote: "I pay from my phone and the receipt is there straight away. No more sending screenshots.", author: "Tenant — Kileleshwa" },
    ],
    availability: [
      { feature: "Monthly rent invoices", free: true, pro: true, enterprise: true },
      { feature: "Manual payment recording", free: true, pro: true, enterprise: true },
      { feature: "Paystack online payments", free: true, pro: true, enterprise: true },
      { feature: "Receipts", free: true, pro: true, enterprise: true },
      { feature: "Automated rent reminders", free: false, pro: true, enterprise: true },
      { feature: "Payment exports", free: false, pro: true, enterprise: true },
    ],
    faqs: [
      { q: "How do tenants pay?", a: "Through Paystack checkout from their dashboard. Paystack supports cards, bank transfer and mobile money, so tenants choose their preferred method at checkout." },
      { q: "Can I still record cash payments?", a: "Yes. Landlords can record a payment manually with the method and date, and the tenant's record updates immediately." },
      { q: "When are invoices generated?", a: "A scheduled job runs on the first of each month and raises an Unpaid record for every active tenancy." },
      { q: "What happens if a tenant pays late?", a: "The record stays Unpaid and is marked Overdue once the due date passes, so it stands out on both dashboards." },
    ],
  },
  {
    slug: "tenant-management",
    name: "Tenant Management",
    eyebrow: "Tenant Management",
    headline: "Tenancies that",
    emphasis: "manage themselves",
    hero: "Give each property a unique code, let tenants link themselves, approve with one tap and keep every tenancy record in one place.",
    metaTitle: "Tenant Management Software for Kenyan Landlords | RentEasy",
    metaDescription:
      "Onboard tenants with a property code, approve link requests in one tap, and keep leases, contacts and rent status in a single record.",
    image: "interior",
    benefits: [
      { title: "Property codes", text: "Every property carries a unique PROP code. Share it once and tenants onboard themselves." },
      { title: "Approval control", text: "No tenant appears on your books until you approve the link request." },
      { title: "One tenant record", text: "Contact details, unit, rent amount, due day and payment history in a single view." },
      { title: "Seeker upgrades", text: "Property seekers become tenants by entering a code — no second account, no re-registration." },
      { title: "Notifications", text: "Link requests, approvals and payments raise in-app notifications for both sides." },
      { title: "Protected data", text: "Row-level security means a tenant can only ever see their own record." },
    ],
    features: [
      { title: "Self-service linking", text: "Tenants enter the property code in settings; the request lands in the landlord's queue as pending." },
      { title: "Approve or decline", text: "Approve a request to activate the tenancy, or decline it if the code was shared in error." },
      { title: "Tenant directory", text: "Searchable table of tenants across every property with status and outstanding balance." },
      { title: "Add tenants directly", text: "Landlords can create a tenancy themselves when the tenant is not yet on the platform." },
      { title: "Bulk tenant import", text: "Import an existing rent roll from CSV instead of typing it in.", badge: "Paid" },
      { title: "Vacancy status", text: "Units flip between occupied and vacant automatically as tenancies start and end." },
    ],
    useCases: [
      { label: "Onboarding", quote: "I hand new tenants the property code with the keys. By the evening they're on the system.", author: "Landlord — Lavington" },
      { label: "Handover", quote: "Moving my rent roll over took one CSV upload instead of a weekend.", author: "Agent, 80 units — Nairobi" },
      { label: "Seeker to tenant", quote: "I found the flat on the marketplace and became a tenant with the same login.", author: "Tenant — Ruaka" },
    ],
    availability: [
      { feature: "Property codes", free: true, pro: true, enterprise: true },
      { feature: "Link approvals", free: true, pro: true, enterprise: true },
      { feature: "Tenant directory", free: "Up to 10", pro: "Up to 100", enterprise: "500+" },
      { feature: "Bulk CSV import", free: false, pro: true, enterprise: true },
      { feature: "Multiple managers", free: false, pro: false, enterprise: true },
    ],
    faqs: [
      { q: "What is a property code?", a: "A unique PROP-XXXXXX code generated for each property you publish. Tenants enter it to request a link to that property." },
      { q: "Can a tenant link without my approval?", a: "No. Requests arrive as pending and only become active tenancies once you approve them." },
      { q: "What if a code is shared publicly?", a: "You still control approvals, and you can decline any request. Codes can be regenerated if needed." },
    ],
  },
  {
    slug: "marketplace",
    name: "Property Marketplace",
    eyebrow: "Marketplace",
    headline: "List a vacancy,",
    emphasis: "fill it faster",
    hero: "Publish vacant units to a public marketplace with photographs, amenities and pricing, and take enquiries directly inside the platform.",
    metaTitle: "Rental Property Marketplace in Nairobi | RentEasy Kenya",
    metaDescription:
      "List vacant rentals with photos, amenities and pricing on the RentEasy marketplace, and handle tenant enquiries in one place.",
    image: "estate",
    benefits: [
      { title: "Five-step publishing", text: "Basics, pricing, photographs, amenities and publish — a wizard that takes minutes, not hours." },
      { title: "Photo galleries", text: "Upload multiple images per listing with a full-screen gallery for seekers." },
      { title: "Qualified enquiries", text: "Seekers enquire from the listing page and the conversation starts in your inbox." },
      { title: "Search and filters", text: "Seekers filter by location, bedrooms and price to reach the right units." },
      { title: "Automatic vacancy sync", text: "A unit taken off the market stops showing the moment a tenancy begins." },
      { title: "Featured placement", text: "Higher tiers surface listings on the homepage collection." },
    ],
    features: [
      { title: "Listing wizard", text: "Guided five-step flow with validation so a listing never publishes half-finished." },
      { title: "Amenities and details", text: "Bedrooms, bathrooms, parking, water, security and more captured as structured fields." },
      { title: "Enquiry inbox", text: "Every enquiry becomes a conversation thread tied to the listing." },
      { title: "WhatsApp handoff", text: "Move a serious enquiry to WhatsApp with one tap when a viewing needs arranging." },
      { title: "Listing analytics", text: "Views and enquiries per listing so you know which units need better photographs.", badge: "Paid" },
      { title: "Homepage collection", text: "Selected listings appear in the curated collection on the public landing page." },
    ],
    useCases: [
      { label: "Vacancy", quote: "Two viewings within a day of publishing. The photographs did the work.", author: "Landlord — Kilimani" },
      { label: "Seeker", quote: "I could see the amenities and the price before I wasted a trip across town.", author: "Property seeker — Nairobi" },
      { label: "Agent", quote: "Enquiries land in one inbox instead of four phone numbers.", author: "Letting agent — Westlands" },
    ],
    availability: [
      { feature: "Public listings", free: "1 active", pro: "Unlimited", enterprise: "Unlimited" },
      { feature: "Photo galleries", free: true, pro: true, enterprise: true },
      { feature: "Enquiry inbox", free: true, pro: true, enterprise: true },
      { feature: "Listing analytics", free: false, pro: true, enterprise: true },
      { feature: "Featured placement", free: false, pro: true, enterprise: true },
    ],
    faqs: [
      { q: "Does listing cost extra?", a: "No. Listings are included in your plan; higher tiers simply allow more active listings and featured placement." },
      { q: "Who can see my listings?", a: "Published listings are public so anyone searching can find them. Unpublished drafts stay private to you." },
      { q: "How do enquiries reach me?", a: "As an in-app conversation with a notification. You can continue on WhatsApp if you prefer." },
    ],
  },
  {
    slug: "analytics",
    name: "Analytics & Reports",
    eyebrow: "Analytics",
    headline: "Know how the portfolio is",
    emphasis: "actually performing",
    hero: "Collection rates, revenue trends, occupancy and per-property performance — presented clearly and exportable when you need to share it.",
    metaTitle: "Rental Portfolio Analytics & Reports | RentEasy Kenya",
    metaDescription:
      "Track collection rate, revenue trends, occupancy and per-property performance across your Kenyan rental portfolio, with exportable reports.",
    image: "rent",
    benefits: [
      { title: "Collection rate", text: "The single number that matters: what share of billed rent actually arrived this month." },
      { title: "Revenue trends", text: "Month-on-month revenue charted across the whole portfolio." },
      { title: "Per-property view", text: "Compare buildings side by side to find the one dragging the average down." },
      { title: "Occupancy", text: "Occupied versus vacant units, tracked as tenancies start and end." },
      { title: "Payment status mix", text: "Paid, pending and overdue at a glance, without opening a spreadsheet." },
      { title: "Exports", text: "Download reports as PDF or CSV for financiers, co-owners and accountants." },
    ],
    features: [
      { title: "KPI cards", text: "Revenue, collection rate, active tenants and occupancy summarised at the top of the dashboard." },
      { title: "Revenue chart", text: "Rolling monthly revenue with comparison against billed amounts." },
      { title: "Payment status chart", text: "Distribution of rent records by status for the selected period." },
      { title: "Property performance", text: "Ranked comparison of properties by revenue and collection rate." },
      { title: "PDF reports", text: "Formatted statements you can send to an owner or a bank.", badge: "Paid" },
      { title: "CSV export", text: "Raw rows for your own analysis in Excel or Sheets.", badge: "Paid" },
    ],
    useCases: [
      { label: "Owner reporting", quote: "I send the owners a PDF each month instead of rebuilding a spreadsheet.", author: "Manager — Nairobi" },
      { label: "Problem spotting", quote: "One building sat at 62% collection. I would not have noticed it in a list of invoices.", author: "Landlord, 3 buildings" },
      { label: "Financing", quote: "The bank wanted twelve months of collections. It was one export.", author: "Investor — Karen" },
    ],
    availability: [
      { feature: "KPI summary", free: true, pro: true, enterprise: true },
      { feature: "Revenue & status charts", free: "Last 3 months", pro: "Full history", enterprise: "Full history" },
      { feature: "Property comparison", free: false, pro: true, enterprise: true },
      { feature: "PDF reports", free: false, pro: true, enterprise: true },
      { feature: "CSV export", free: false, pro: true, enterprise: true },
    ],
    faqs: [
      { q: "Where does the data come from?", a: "Directly from your rent records, tenancies and properties — there is nothing extra to maintain." },
      { q: "Can I share reports?", a: "Yes. Paid plans export PDF and CSV that you can send to owners, accountants or lenders." },
    ],
  },
  {
    slug: "bulk-operations",
    name: "Bulk Operations",
    eyebrow: "Bulk Operations",
    headline: "Move a whole portfolio",
    emphasis: "in one action",
    hero: "Import tenants and properties from CSV, raise invoices across every unit at once, and send a message to every tenant in a building.",
    metaTitle: "Bulk Tenant & Property Operations | RentEasy Kenya",
    metaDescription:
      "Import tenants and properties from CSV, raise invoices in bulk and message every tenant in a building at once with RentEasy Kenya.",
    image: "interior",
    benefits: [
      { title: "CSV import", text: "Bring an existing rent roll onto the platform without retyping it." },
      { title: "Bulk invoicing", text: "Raise or adjust rent records across many tenancies in a single pass." },
      { title: "Bulk messaging", text: "Notify every tenant in a building about water, maintenance or a rent change." },
      { title: "Validation first", text: "Imports are checked row by row and problems are reported before anything is written." },
      { title: "Audit trail", text: "Every bulk action is logged with who ran it and when." },
      { title: "Reversible", text: "Preview the result before committing so a bad file never reaches your tenants." },
    ],
    features: [
      { title: "Tenant CSV import", text: "Map columns for name, contact, unit, rent amount and due day." },
      { title: "Property CSV import", text: "Create many properties at once, each with its own generated code." },
      { title: "Bulk rent generation", text: "Trigger invoice creation for a selected set of tenancies outside the monthly schedule." },
      { title: "Bulk announcements", text: "Send one message to every tenant of a property as an in-app notification." },
      { title: "Error reports", text: "Download the rows that failed with the reason for each." },
      { title: "Activity logging", text: "Bulk runs appear in the admin activity log for accountability." },
    ],
    useCases: [
      { label: "Migration", quote: "Ninety tenancies moved across in an afternoon.", author: "Property manager — Nairobi" },
      { label: "Rent review", quote: "Annual increases applied to a whole block without touching each tenant.", author: "Landlord — Kileleshwa" },
      { label: "Maintenance notice", quote: "Water shutdown announced to sixty tenants in one message.", author: "Caretaker — Ngong Road" },
    ],
    availability: [
      { feature: "Tenant CSV import", free: false, pro: true, enterprise: true },
      { feature: "Property CSV import", free: false, pro: true, enterprise: true },
      { feature: "Bulk invoicing", free: false, pro: true, enterprise: true },
      { feature: "Bulk messaging", free: false, pro: "Per property", enterprise: "Portfolio-wide" },
      { feature: "Error reports", free: false, pro: true, enterprise: true },
    ],
    faqs: [
      { q: "What format should the CSV be?", a: "A downloadable template is provided in the import screen with the exact columns expected." },
      { q: "What if some rows fail?", a: "Valid rows import and failed rows are returned in a report with the reason, so you can fix and re-upload only those." },
    ],
  },
  {
    slug: "messaging",
    name: "Messaging & Notifications",
    eyebrow: "Messaging",
    headline: "Every conversation,",
    emphasis: "on the record",
    hero: "In-app chat between landlords, tenants and seekers, backed by notifications and email so nothing important is missed.",
    metaTitle: "Landlord & Tenant Messaging | RentEasy Kenya",
    metaDescription:
      "Keep landlord, tenant and seeker conversations in one place with in-app chat, notifications and email alerts from RentEasy Kenya.",
    image: "estate",
    benefits: [
      { title: "One inbox", text: "Enquiries, tenancy questions and maintenance requests in a single thread list." },
      { title: "Tied to context", text: "Conversations are linked to the listing or tenancy they concern." },
      { title: "Notifications", text: "In-app alerts for link requests, approvals, payments and new messages." },
      { title: "Email alerts", text: "Verification outcomes and rent reminders go out by email as well." },
      { title: "WhatsApp handoff", text: "Continue on WhatsApp when a call or a viewing needs arranging." },
      { title: "History retained", text: "Threads stay available so you can check what was agreed." },
    ],
    features: [
      { title: "Conversation list", text: "Threads sorted by recent activity with unread indicators." },
      { title: "Real-time chat", text: "Messages appear without refreshing for both parties." },
      { title: "Notification centre", text: "A dedicated page and bell for everything that needs attention." },
      { title: "Enquiry threads", text: "Marketplace enquiries open a thread automatically." },
      { title: "Transactional email", text: "Approval, rejection and reminder emails delivered reliably." },
      { title: "Read state", text: "Notifications mark as read individually or all at once." },
    ],
    useCases: [
      { label: "Maintenance", quote: "The tenant reported a leak in the app and I had a plumber there the same day.", author: "Landlord — Parklands" },
      { label: "Viewings", quote: "Enquiry, questions, viewing time — all in one thread.", author: "Agent — Nairobi" },
      { label: "Records", quote: "When there was a dispute, the messages settled it.", author: "Landlord — Embakasi" },
    ],
    availability: [
      { feature: "In-app chat", free: true, pro: true, enterprise: true },
      { feature: "Notification centre", free: true, pro: true, enterprise: true },
      { feature: "Email notifications", free: "Account only", pro: true, enterprise: true },
      { feature: "Bulk announcements", free: false, pro: true, enterprise: true },
    ],
    faqs: [
      { q: "Are messages private?", a: "Yes. Only the participants of a thread can read it, enforced at the database level." },
      { q: "Do I get notified by email?", a: "Account and verification emails go to everyone. Paid plans add rent reminders and activity emails." },
    ],
  },
  {
    slug: "services",
    name: "Professional Services",
    eyebrow: "Professional Services",
    headline: "Help getting",
    emphasis: "set up properly",
    hero: "Data migration, portfolio setup, team training and priority support for landlords and managers moving a live portfolio onto the platform.",
    metaTitle: "Onboarding & Professional Services | RentEasy Kenya",
    metaDescription:
      "Data migration, portfolio setup, training and priority support for Kenyan landlords and property managers adopting RentEasy Kenya.",
    image: "interior",
    benefits: [
      { title: "Migration", text: "We take your spreadsheets and get properties, tenancies and balances onto the platform." },
      { title: "Portfolio setup", text: "Properties configured with codes, rent amounts, due days and listings ready to publish." },
      { title: "Team training", text: "A working session for caretakers and office staff on the flows they will use daily." },
      { title: "Priority support", text: "A direct line for Enterprise accounts rather than a general queue." },
      { title: "Custom reporting", text: "Report formats shaped to what your owners or lenders expect to see." },
      { title: "Account review", text: "Periodic reviews of collection performance and platform usage." },
    ],
    features: [
      { title: "Guided migration", text: "We prepare and validate the import files with you before anything goes live." },
      { title: "Configuration", text: "Tiers, users, properties and notification settings configured to your operation." },
      { title: "Training session", text: "Live walkthrough for landlords, managers and caretakers." },
      { title: "Priority response", text: "Faster response targets for Enterprise accounts.", badge: "Enterprise" },
      { title: "Custom reports", text: "Bespoke statement layouts for owners and financiers.", badge: "Enterprise" },
      { title: "Dedicated contact", text: "A named point of contact for the account.", badge: "Enterprise" },
    ],
    useCases: [
      { label: "Migration", quote: "They moved eleven years of records and the balances tallied.", author: "Managing agent — Nairobi" },
      { label: "Training", quote: "The caretakers picked it up in a single session.", author: "Landlord, 3 blocks" },
      { label: "Support", quote: "Questions answered the same day, which matters at month end.", author: "Enterprise client" },
    ],
    availability: [
      { feature: "Self-serve onboarding", free: true, pro: true, enterprise: true },
      { feature: "Assisted migration", free: false, pro: "On request", enterprise: true },
      { feature: "Team training", free: false, pro: false, enterprise: true },
      { feature: "Priority support", free: false, pro: false, enterprise: true },
      { feature: "Custom reporting", free: false, pro: false, enterprise: true },
    ],
    faqs: [
      { q: "Is there a setup fee?", a: "Self-serve onboarding is free on every plan. Assisted migration and training are included with Enterprise and quoted separately otherwise." },
      { q: "How long does migration take?", a: "Most portfolios are live within a week of sending us clean data." },
    ],
  },
];

export const productBySlug = (slug?: string) =>
  products.find((p) => p.slug === slug);
