export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  date: string;
  body: { heading?: string; paragraphs: string[]; list?: string[] }[];
}

export const articles: Article[] = [
  {
    slug: "how-to-collect-rent-on-time-in-kenya",
    title: "How to collect rent on time in Kenya",
    description:
      "Practical steps Kenyan landlords use to lift collection rates: clear due dates, automatic invoices, online payment options and a reminder rhythm that works.",
    category: "Rent collection",
    readTime: "6 min read",
    date: "2026-06-14",
    body: [
      {
        paragraphs: [
          "Late rent is rarely a tenant problem alone. In most small portfolios it is a process problem: the invoice was never issued, the due date was never stated in writing, and the reminder came a week after the money had already been spent elsewhere.",
          "Landlords who consistently collect above 95% tend to do four things well. None of them require a lawyer.",
        ],
      },
      {
        heading: "1. Put the due date in writing, once",
        paragraphs: [
          "Agree a single due day per tenancy — the 1st or the 5th — and record it on the tenancy itself rather than in a WhatsApp thread. When the date lives on the record, every invoice, reminder and overdue flag derives from the same source.",
        ],
      },
      {
        heading: "2. Issue an invoice before the money is due",
        paragraphs: [
          "An invoice raised on the 1st is a reminder in its own right. Manually raising twelve invoices a month across three buildings is where most landlords fall down, which is why automatic monthly generation matters more than it sounds.",
        ],
      },
      {
        heading: "3. Remove friction from paying",
        paragraphs: [
          "Every extra step between intention and payment loses you money. A tenant who has to ask for account details, make a transfer, screenshot it and send it to you will pay later than one who taps a button on their phone.",
          "Online checkout through a Kenyan payment processor covers card, bank and mobile money in one flow, and confirms the payment against the invoice without you reconciling anything.",
        ],
      },
      {
        heading: "4. Build a reminder rhythm",
        paragraphs: [
          "Three touches is usually enough: three days before the due date, on the due date, and three days after. Keep the tone neutral and factual. The purpose is to make the payment easy to remember, not to open a negotiation.",
        ],
        list: [
          "T-3 days: friendly notice with the amount and a payment link",
          "Due date: short confirmation reminder",
          "T+3 days: overdue notice stating the outstanding amount",
        ],
      },
      {
        heading: "Track the number that matters",
        paragraphs: [
          "Collection rate — rent received divided by rent billed — is the single metric that tells you whether the process works. Watch it monthly per property, not per portfolio, because one weak building will hide behind three good ones.",
        ],
      },
    ],
  },
  {
    slug: "landlord-guide-to-tenant-screening",
    title: "A landlord's guide to tenant screening in Nairobi",
    description:
      "What to verify before handing over keys in Nairobi: identity, income, references and the red flags worth walking away from.",
    category: "Tenant management",
    readTime: "7 min read",
    date: "2026-06-28",
    body: [
      {
        paragraphs: [
          "A vacant unit costs you one month's rent. The wrong tenant can cost you six, plus legal fees and repairs. Screening is the cheapest insurance available to a landlord.",
        ],
      },
      {
        heading: "Verify identity properly",
        paragraphs: [
          "Take a copy of the national ID or passport and check that the name matches every other document you are given. A tenant unwilling to provide identification at application stage is telling you something useful.",
        ],
      },
      {
        heading: "Establish affordability",
        paragraphs: [
          "The common rule of thumb in Nairobi is that rent should not exceed a third of net monthly income. Ask for three months of payslips or bank statements, or for self-employed applicants, six months of M-Pesa or bank statements showing consistent inflows.",
        ],
      },
      {
        heading: "Call the previous landlord — not the one on the form",
        paragraphs: [
          "Applicants sometimes supply a friend's number. Ask for the property address and find the landlord independently where you can. Two questions matter: did they pay on time, and would you rent to them again?",
        ],
      },
      {
        heading: "Red flags",
        paragraphs: ["None of these are disqualifying alone, but two together justify caution."],
        list: [
          "Reluctance to provide identification or references",
          "Offering several months of rent upfront in cash without explanation",
          "A history of frequent moves with short tenancies",
          "Pressure to move in immediately without paperwork",
        ],
      },
      {
        heading: "Document the tenancy",
        paragraphs: [
          "Write down the rent, deposit, due day, notice period and what the deposit covers. Keep the record where both sides can see it. Most disputes in Kenyan rentals come down to two people remembering a verbal agreement differently.",
        ],
      },
    ],
  },
  {
    slug: "understanding-rental-income-tax-kenya",
    title: "Understanding rental income tax in Kenya",
    description:
      "A plain-language overview of Monthly Rental Income tax for Kenyan residential landlords, what records to keep and how to stay compliant.",
    category: "Compliance",
    readTime: "6 min read",
    date: "2026-07-05",
    body: [
      {
        paragraphs: [
          "This article is general information for Kenyan residential landlords, not tax advice. Rates and thresholds change — confirm current figures with KRA or your tax adviser before filing.",
        ],
      },
      {
        heading: "The Monthly Rental Income regime",
        paragraphs: [
          "Residential landlords in Kenya within the prescribed annual rent band fall under the Monthly Rental Income (MRI) regime. It is charged on gross rent received, not on profit, which means it is simple to compute but gives no relief for expenses.",
          "MRI is filed and paid monthly through iTax, by the due date following the month in which rent was received. Filing a nil return in a month with no rent is still required.",
        ],
      },
      {
        heading: "Records worth keeping",
        paragraphs: [
          "Whichever regime applies to you, the records are the same. Keep them monthly rather than reconstructing them in a panic at year end.",
        ],
        list: [
          "Rent invoiced and rent actually received, per unit",
          "Dates and methods of payment, with references",
          "Deposits held and deposits refunded",
          "Repairs, service charge, agent fees and other property costs",
          "Tenancy agreements and notice correspondence",
        ],
      },
      {
        heading: "Why software helps here",
        paragraphs: [
          "Because MRI is charged on rent received, you need a reliable record of what actually arrived and when. A platform that timestamps every confirmed payment and lets you export a month's collections gives your accountant exactly what they ask for.",
        ],
      },
      {
        heading: "Common mistakes",
        paragraphs: [
          "The two that cost landlords most are treating invoiced rent as received rent, and losing track of deposits by mixing them with rental income. Keep both distinct in your records from the start.",
        ],
      },
    ],
  },
  {
    slug: "pricing-your-rental-property-nairobi",
    title: "Pricing your rental property in Nairobi",
    description:
      "How to set a rent that fills the unit quickly without leaving money behind: comparables, void cost maths and when to adjust.",
    category: "Marketplace",
    readTime: "5 min read",
    date: "2026-07-12",
    body: [
      {
        paragraphs: [
          "Overpricing a unit is expensive in a way that is easy to miss. A flat listed 10% above market may sit empty for two months. The two months lost cost far more than the 10% ever earned.",
        ],
      },
      {
        heading: "Do the void maths first",
        paragraphs: [
          "A unit at KES 60,000 that stands empty for two months loses KES 120,000. Reducing the asking rent to KES 55,000 and filling it in two weeks costs KES 60,000 over a full year. The lower rent wins comfortably.",
        ],
      },
      {
        heading: "Find genuine comparables",
        paragraphs: [
          "Compare like with like: same neighbourhood, same bedroom count, similar finishes, similar access to water and parking. Three current listings beat a memory of what the unit fetched two years ago.",
        ],
      },
      {
        heading: "Price the extras honestly",
        paragraphs: [
          "Borehole water, a backup generator, secure parking and lift access all command real premiums in Nairobi. So does proximity to a main road for commuting. If your unit has none of them, no photograph will make up the difference.",
        ],
      },
      {
        heading: "Know when to move",
        paragraphs: [
          "Enquiries tell you before viewings do. A listing with strong views and no enquiries after two weeks is priced wrong. A listing with enquiries and no offers after several viewings usually has a presentation or condition problem instead.",
        ],
      },
    ],
  },
  {
    slug: "digital-vs-manual-property-management",
    title: "Digital vs manual property management: what actually changes",
    description:
      "An honest comparison of spreadsheets and WhatsApp against a property management platform, and where each still makes sense.",
    category: "Operations",
    readTime: "5 min read",
    date: "2026-07-19",
    body: [
      {
        paragraphs: [
          "Plenty of Kenyan landlords run a handful of units perfectly well on a notebook. The question is not whether manual works, but at what point it stops working.",
        ],
      },
      {
        heading: "Where manual holds up",
        paragraphs: [
          "One or two units, long-standing tenants, cash or direct transfer, no staff. The overhead of any system exceeds the benefit. A dated notebook and bank statements are sufficient records.",
        ],
      },
      {
        heading: "Where it breaks",
        paragraphs: [
          "The failure points appear predictably as the portfolio grows.",
        ],
        list: [
          "More than one person needs the same information at the same time",
          "You cannot answer 'who has not paid?' without opening three files",
          "Receipts are screenshots that live only on a phone",
          "A tenant disputes a payment and there is no timestamped record",
          "Tax filing requires a weekend of reconstruction",
        ],
      },
      {
        heading: "What a platform actually changes",
        paragraphs: [
          "Not effort — accuracy and recall. Invoices exist whether or not you remembered them. Payments are attached to the invoice they settle. Every conversation and confirmation is timestamped and retrievable. The work you save is mostly the work of remembering.",
        ],
      },
      {
        heading: "Migrating without disruption",
        paragraphs: [
          "Move one building first, run it in parallel for a month, then bring the rest across. Import your existing rent roll rather than retyping it, and reconcile opening balances before you switch off the spreadsheet.",
        ],
      },
    ],
  },
  {
    slug: "tenant-rights-and-responsibilities-kenya",
    title: "Tenant rights and responsibilities in Kenya",
    description:
      "What Kenyan tenants can reasonably expect from a landlord, what is expected of them, and how to keep a tenancy dispute from escalating.",
    category: "Tenants",
    readTime: "6 min read",
    date: "2026-07-26",
    body: [
      {
        paragraphs: [
          "Most tenancy disputes in Kenya are avoidable. They begin with an unwritten agreement and end with two people who genuinely believe they are right. This is a general overview, not legal advice.",
        ],
      },
      {
        heading: "What a tenant can reasonably expect",
        paragraphs: [
          "Quiet enjoyment of the property, a habitable unit with working essential services, reasonable notice before entry, and a receipt for every payment made.",
        ],
        list: [
          "Written terms covering rent, deposit, due day and notice period",
          "Notice before a landlord or caretaker enters the unit",
          "Repairs to structural and essential services within reasonable time",
          "A clear account of deductions when a deposit is refunded",
        ],
      },
      {
        heading: "What is expected of a tenant",
        paragraphs: [
          "Paying rent on the agreed date, using the property as agreed, reporting faults promptly rather than after damage spreads, and giving proper notice before vacating.",
        ],
      },
      {
        heading: "Deposits",
        paragraphs: [
          "The deposit secures against damage and unpaid rent — not ordinary wear. Photograph the unit at move-in and again at move-out. A dated set of photographs settles almost every deposit argument before it starts.",
        ],
      },
      {
        heading: "If a dispute arises",
        paragraphs: [
          "Put the issue in writing and keep the thread. Ask for a specific outcome and a date. Most matters resolve here. Where they do not, written records and payment receipts are what any tribunal or mediator will ask for first.",
        ],
      },
    ],
  },
];

export const articleBySlug = (slug?: string) =>
  articles.find((a) => a.slug === slug);
