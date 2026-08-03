import { HeroVeil } from "@/components/shared/HeroVeil";
import heroNews from "@/assets/neighborhood-runda.jpg";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import Seo from "@/components/marketing/Seo";
import { Section, Reveal, CtaBand } from "@/components/marketing/sections";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";

const interests = [
  "Rent collection",
  "Tenant management",
  "Marketplace & listings",
  "Analytics & reporting",
  "Kenyan tenancy law",
  "Product updates",
];

const promises = [
  { title: "Once a month", text: "One considered edition — never a daily drip." },
  { title: "Written for Kenya", text: "KES figures, local law, local payment realities." },
  { title: "Unsubscribe anytime", text: "One click. We never sell or share your address." },
];

const NewsletterPage = () => (
  <MarketingLayout>
    <Seo
      title="Newsletter — monthly guides for Kenyan landlords | RentEasy Kenya"
      description="Join the RentEasy Kenya newsletter for monthly rental management guides, tenancy law updates and product news. Unsubscribe anytime."
      path="/newsletter"
    />

    <Section className="relative isolate overflow-hidden !pt-32 md:!pt-40">
      <HeroVeil image={heroNews} />
      <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
        <div>
          <span className="block text-[10px] uppercase tracking-[0.4em] text-primary mb-6">
            — Newsletter
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.03] on-veil">
            The landlord{" "}
            <span className="italic font-light text-accent">dispatch</span>
          </h1>
          <p className="mt-6 max-w-lg on-veil-muted font-light leading-relaxed">
            Once a month: a practical guide, a note on what changed in Kenyan
            tenancy practice, and anything new we have shipped.
          </p>

          <div className="mt-12 grid gap-px border border-primary/12 bg-primary/10 sm:grid-cols-3">
            {promises.map((p) => (
              <div key={p.title} className="bg-background p-6">
                <h2 className="font-serif text-lg text-accent">{p.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-foreground/50 font-light">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Reveal>
          <div className="border border-primary/20 bg-card p-8 md:p-10">
            <EmailCaptureForm
              source="newsletter"
              title="Join the dispatch"
              description="Tell us what you care about and we will keep it relevant."
              interests={interests}
              buttonLabel="Subscribe"
              successMessage="You're subscribed. The next edition lands at the start of the month."
            />
          </div>
        </Reveal>
      </div>
    </Section>

    <CtaBand
      title="Or skip ahead and"
      emphasis="start free."
      sub="Add your first property, issue an invoice and collect rent online today."
    />
  </MarketingLayout>
);

export default NewsletterPage;
