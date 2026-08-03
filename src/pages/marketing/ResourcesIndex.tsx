import { HeroVeil } from "@/components/shared/HeroVeil";
import heroResources from "@/assets/neighborhood-karen.jpg";
import { Link } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import Seo from "@/components/marketing/Seo";
import {
  Section,
  SectionHeading,
  CtaBand,
  Reveal,
} from "@/components/marketing/sections";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";
import { articles } from "@/content/blog";

const categories = Array.from(new Set(articles.map((a) => a.category)));

const ResourcesIndex = () => {
  const [featured, ...rest] = articles;

  return (
    <MarketingLayout>
      <Seo
        title="Resources — guides for Kenyan landlords | RentEasy Kenya"
        description="Practical guides on rent collection, tenant screening, Kenyan tenancy law and running a rental portfolio profitably."
        path="/resources"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "RentEasy Kenya Resources",
          blogPost: articles.map((a) => ({
            "@type": "BlogPosting",
            headline: a.title,
            datePublished: a.date,
            url: `https://renteasy-kenya-landing.lovable.app/resources/blog/${a.slug}`,
          })),
        }}
      />

      <Section className="relative isolate overflow-hidden !pt-32 md:!pt-40 !pb-20 md:!pb-24">
        <HeroVeil image={heroResources} />
        <span className="block text-[10px] uppercase tracking-[0.4em] text-primary mb-6">
          — Resources
        </span>
        <h1 className="max-w-3xl font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] on-veil">
          Field notes for{" "}
          <span className="italic font-light text-accent">Kenyan landlords</span>
        </h1>
        <p className="mt-6 max-w-xl on-veil-muted font-light leading-relaxed">
          Written guides on collection, screening, tenancy law and portfolio
          performance — drawn from how landlords actually run their buildings.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((c) => (
            <span
              key={c}
              className="border border-primary/25 px-3 py-2 text-[9px] uppercase tracking-[0.25em] text-foreground/60"
            >
              {c}
            </span>
          ))}
        </div>
      </Section>

      {featured && (
        <Section className="!pt-10 !pb-10">
          <Reveal>
            <Link
              to={`/resources/blog/${featured.slug}`}
              className="group block border border-primary/20 bg-card p-8 md:p-12 transition-colors hover:border-primary/55"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-primary">
                Featured · {featured.category}
              </span>
              <h2 className="mt-5 max-w-3xl font-serif text-3xl md:text-4xl leading-[1.08] text-foreground group-hover:text-accent transition-colors">
                {featured.title}
              </h2>
              <p className="mt-4 max-w-2xl text-foreground/55 font-light leading-relaxed">
                {featured.description}
              </p>
              <span className="mt-6 block text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                {featured.readTime}
              </span>
            </Link>
          </Reveal>
        </Section>
      )}

      <Section className="!pt-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a, i) => (
            <Reveal key={a.slug} delay={i * 0.04}>
              <Link
                to={`/resources/blog/${a.slug}`}
                className="group flex h-full flex-col border border-primary/15 bg-background p-7 transition-colors hover:border-primary/50"
              >
                <span className="text-[9px] uppercase tracking-[0.3em] text-primary">
                  {a.category}
                </span>
                <h3 className="mt-4 font-serif text-xl leading-snug text-foreground group-hover:text-accent transition-colors">
                  {a.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/55 font-light">
                  {a.description}
                </p>
                <span className="mt-6 text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                  {a.readTime}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="bg-card border-y border-primary/10">
        <Reveal>
          <SectionHeading
            eyebrow="Newsletter"
            title="New guides, once a month"
            subtitle="No noise — just new guides and product updates for Kenyan landlords."
          />
          <div className="max-w-xl">
            <EmailCaptureForm
              source="resources"
              title="Subscribe to the newsletter"
              buttonLabel="Subscribe"
            />
          </div>
        </Reveal>
      </Section>

      <CtaBand
        title="Put the guides"
        emphasis="into practice."
        sub="Set up your first property and start invoicing on the free plan."
      />
    </MarketingLayout>
  );
};

export default ResourcesIndex;
