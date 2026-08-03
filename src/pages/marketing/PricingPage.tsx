import { HeroVeil } from "@/components/shared/HeroVeil";
import heroPricing from "@/assets/marketing-interior.jpg";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import Seo, { faqJsonLd } from "@/components/marketing/Seo";
import {
  Section,
  SectionHeading,
  FaqAccordion,
  CtaBand,
  Reveal,
  goldButton,
  ghostButton,
} from "@/components/marketing/sections";
import { tiers, pricingFaqs } from "@/content/pricing";

const PricingPage = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <MarketingLayout>
      <Seo
        title="Pricing — RentEasy Kenya property management plans"
        description="Simple KES pricing for Kenyan landlords. Start free with 5 properties, upgrade for analytics, bulk operations and automated rent reminders."
        path="/pricing"
        jsonLd={faqJsonLd(pricingFaqs)}
      />

      <Section className="relative isolate overflow-hidden !pt-32 md:!pt-40 !pb-20 md:!pb-24">
        <HeroVeil image={heroPricing} />
        <span className="block text-[10px] uppercase tracking-[0.4em] text-primary mb-6">
          — Plans &amp; pricing
        </span>
        <h1 className="max-w-3xl font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] on-veil">
          Priced for Kenyan landlords,{" "}
          <span className="italic font-light text-accent">from one unit upwards</span>
        </h1>
        <p className="mt-6 max-w-xl on-veil-muted font-light leading-relaxed">
          Every plan includes rent invoicing, online payments through Paystack and
          receipts. Higher tiers raise your limits and unlock automation.
        </p>

        <div className="mt-10 inline-flex items-center border border-primary/25">
          {[
            { label: "Monthly", value: false },
            { label: "Annual · 2 months free", value: true },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setAnnual(opt.value)}
              className={`min-h-[44px] px-5 sm:px-7 text-[10px] uppercase tracking-[0.25em] transition-colors ${
                annual === opt.value
                  ? "bg-primary text-background"
                  : "on-veil-muted hover:text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section className="!pt-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t, i) => {
            const price = annual ? t.annual : t.monthly;
            return (
              <Reveal key={t.slug} delay={i * 0.05}>
                <div
                  className={`flex h-full flex-col border p-7 transition-colors ${
                    t.highlight
                      ? "border-primary/60 bg-card"
                      : "border-primary/15 bg-background hover:border-primary/40"
                  }`}
                >
                  {t.highlight && (
                    <span className="mb-4 self-start border border-primary/50 px-2 py-1 text-[8px] uppercase tracking-[0.25em] text-primary">
                      Most chosen
                    </span>
                  )}
                  <h2 className="font-serif text-2xl text-foreground">{t.name}</h2>
                  <p className="mt-2 text-xs text-foreground/50 font-light">
                    {t.tagline}
                  </p>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-serif text-4xl text-accent">
                      {price === 0 ? "Free" : `KES ${price.toLocaleString()}`}
                    </span>
                    {price !== 0 && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                        /{annual ? "yr" : "mo"}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 space-y-1 border-y border-primary/12 py-4 text-[11px] uppercase tracking-[0.2em] text-foreground/55">
                    <p>{t.properties}</p>
                    <p>{t.tenants}</p>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {t.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm text-foreground/65 font-light">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/auth"
                    className={`mt-8 w-full ${t.highlight ? goldButton : ghostButton}`}
                  >
                    {t.cta}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Link
          to="/pricing/compare"
          className="mt-10 inline-block text-[10px] uppercase tracking-[0.3em] text-primary hover:text-accent transition-colors"
        >
          Compare every feature →
        </Link>
      </Section>

      <Section className="bg-card border-y border-primary/10">
        <Reveal>
          <SectionHeading eyebrow="Questions" title="Pricing, answered" />
          <FaqAccordion faqs={pricingFaqs} />
        </Reveal>
      </Section>

      <CtaBand
        title="Start on the free plan"
        emphasis="today."
        sub="No card required. Add your first property and issue your first invoice in minutes."
      />
    </MarketingLayout>
  );
};

export default PricingPage;
