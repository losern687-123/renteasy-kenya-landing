export interface PricingTier {
  name: string;
  slug: string;
  tagline: string;
  monthly: number;
  annual: number;
  properties: string;
  tenants: string;
  highlight?: boolean;
  cta: string;
  features: string[];
}

export const tiers: PricingTier[] = [
  {
    name: "Free",
    slug: "free",
    tagline: "Perfect for getting started",
    monthly: 0,
    annual: 0,
    properties: "Up to 5 properties",
    tenants: "Up to 10 tenants",
    cta: "Start Free",
    features: [
      "Property codes and tenant linking",
      "Monthly rent invoices",
      "Manual payment recording",
      "Paystack online payments",
      "Receipts for every payment",
      "In-app chat and notifications",
      "1 active marketplace listing",
      "Email support",
    ],
  },
  {
    name: "Starter",
    slug: "starter",
    tagline: "For small landlords getting organised",
    monthly: 499,
    annual: 4990,
    properties: "Up to 10 properties",
    tenants: "Up to 25 tenants",
    cta: "Choose Starter",
    features: [
      "Everything in Free",
      "Unlimited marketplace listings",
      "Automated rent reminders",
      "Basic analytics dashboard",
      "Payment history exports",
      "Email support",
    ],
  },
  {
    name: "Professional",
    slug: "pro",
    tagline: "For growing portfolios",
    monthly: 999,
    annual: 9990,
    properties: "Up to 20 properties",
    tenants: "Up to 100 tenants",
    highlight: true,
    cta: "Choose Professional",
    features: [
      "Everything in Starter",
      "Full analytics history",
      "Property performance comparison",
      "PDF and CSV reports",
      "Bulk tenant and property import",
      "Bulk invoicing and announcements",
      "Featured marketplace placement",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    tagline: "For large operators and agencies",
    monthly: 2499,
    annual: 24990,
    properties: "Up to 100 properties",
    tenants: "Up to 500 tenants",
    cta: "Choose Enterprise",
    features: [
      "Everything in Professional",
      "Portfolio-wide bulk messaging",
      "Custom report formats",
      "Assisted data migration",
      "Team training session",
      "Phone and priority support",
      "Dedicated account contact",
    ],
  },
];

export type Cell = true | false | string;

export const comparisonGroups: {
  group: string;
  rows: { feature: string; free: Cell; starter: Cell; pro: Cell; enterprise: Cell }[];
}[] = [
  {
    group: "Limits",
    rows: [
      { feature: "Properties", free: "5", starter: "10", pro: "20", enterprise: "100" },
      { feature: "Tenants", free: "10", starter: "25", pro: "100", enterprise: "500" },
      { feature: "Active marketplace listings", free: "1", starter: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
    ],
  },
  {
    group: "Rent & payments",
    rows: [
      { feature: "Automatic monthly invoices", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Manual payment recording", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Paystack online payments", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Receipts", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Automated rent reminders", free: false, starter: true, pro: true, enterprise: true },
      { feature: "Overdue tracking", free: true, starter: true, pro: true, enterprise: true },
    ],
  },
  {
    group: "Tenants & properties",
    rows: [
      { feature: "Property codes", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Link approvals", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Five-step listing wizard", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Bulk CSV import", free: false, starter: false, pro: true, enterprise: true },
      { feature: "Bulk invoicing", free: false, starter: false, pro: true, enterprise: true },
    ],
  },
  {
    group: "Analytics & reporting",
    rows: [
      { feature: "KPI summary", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Charts history", free: "3 months", starter: "12 months", pro: "Full", enterprise: "Full" },
      { feature: "Property comparison", free: false, starter: false, pro: true, enterprise: true },
      { feature: "PDF reports", free: false, starter: false, pro: true, enterprise: true },
      { feature: "CSV export", free: false, starter: true, pro: true, enterprise: true },
      { feature: "Custom report formats", free: false, starter: false, pro: false, enterprise: true },
    ],
  },
  {
    group: "Communication",
    rows: [
      { feature: "In-app chat", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Notification centre", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Bulk announcements", free: false, starter: false, pro: "Per property", enterprise: "Portfolio-wide" },
    ],
  },
  {
    group: "Support & services",
    rows: [
      { feature: "Email support", free: true, starter: true, pro: true, enterprise: true },
      { feature: "Priority support", free: false, starter: false, pro: true, enterprise: true },
      { feature: "Phone support", free: false, starter: false, pro: false, enterprise: true },
      { feature: "Assisted migration", free: false, starter: false, pro: "On request", enterprise: true },
      { feature: "Team training", free: false, starter: false, pro: false, enterprise: true },
    ],
  },
];

export const pricingFaqs = [
  {
    q: "How is payment handled?",
    a: "Subscriptions are paid through Paystack, which supports card, bank transfer and mobile money. Your plan activates as soon as the payment is confirmed.",
  },
  {
    q: "Can I change plan later?",
    a: "Yes. You can move up or down at any time from subscription settings; the new limits apply immediately.",
  },
  {
    q: "What happens if I exceed my limits?",
    a: "Existing records keep working. You will be prompted to upgrade before adding properties or tenants beyond your plan's limit.",
  },
  {
    q: "Is the Free plan really free?",
    a: "Yes. Free covers up to 5 properties and 10 tenants with rent tracking, payments and receipts included, with no card required.",
  },
  {
    q: "Do tenants pay anything?",
    a: "Tenants never pay a platform subscription. They only pay their rent, and standard Paystack transaction charges apply to online payments.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes — annual billing gives you roughly two months free compared with paying monthly.",
  },
];
