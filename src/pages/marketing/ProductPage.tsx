import { useParams, Navigate, Link } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import Seo, { faqJsonLd } from "@/components/marketing/Seo";
import {
  MarketingHero,
  Section,
  SectionHeading,
  BenefitsGrid,
  FeatureCards,
  UseCaseCards,
  TierAvailability,
  FaqAccordion,
  CtaBand,
  Reveal,
} from "@/components/marketing/sections";
import { productBySlug, products } from "@/content/products";
import heroRent from "@/assets/marketing-rent.jpg";
import heroInterior from "@/assets/marketing-interior.jpg";
import heroEstate from "@/assets/hero-estate.jpg";

const images = { rent: heroRent, interior: heroInterior, estate: heroEstate };

const ProductPage = () => {
  const { slug } = useParams();
  const product = productBySlug(slug);

  if (!product) return <Navigate to="/products" replace />;

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <MarketingLayout>
      <Seo
        title={product.metaTitle}
        description={product.metaDescription}
        path={`/products/${product.slug}`}
        jsonLd={faqJsonLd(product.faqs)}
      />

      <MarketingHero
        eyebrow={product.eyebrow}
        headline={product.headline}
        emphasis={product.emphasis}
        sub={product.hero}
        image={images[product.image]}
        imageAlt={`${product.name} for Kenyan rental properties`}
      />

      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="Why it matters"
            title="What this changes for you"
          />
          <BenefitsGrid benefits={product.benefits} />
        </Reveal>
      </Section>

      <Section className="bg-[#111111] border-y border-[#c9a84c]/10">
        <Reveal>
          <SectionHeading eyebrow="Capabilities" title="What's included" />
          <FeatureCards features={product.features} />
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <SectionHeading eyebrow="In practice" title="How it is being used" />
          <UseCaseCards cases={product.useCases} />
        </Reveal>
      </Section>

      <Section className="bg-[#111111] border-y border-[#c9a84c]/10">
        <Reveal>
          <SectionHeading
            eyebrow="Plans"
            title="Availability by plan"
            subtitle="Every plan includes the essentials. Higher tiers raise limits and unlock automation."
          />
          <TierAvailability rows={product.availability} />
          <Link
            to="/pricing/compare"
            className="mt-6 inline-block text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] hover:text-[#f0d78c] transition-colors"
          >
            See the full comparison →
          </Link>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <SectionHeading eyebrow="Questions" title="Frequently asked" />
          <FaqAccordion faqs={product.faqs} />
        </Reveal>
      </Section>

      <Section className="bg-[#111111] border-t border-[#c9a84c]/10">
        <SectionHeading eyebrow="Explore" title="Related capabilities" />
        <div className="grid gap-6 sm:grid-cols-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              to={`/products/${r.slug}`}
              className="group border border-[#c9a84c]/15 bg-[#0d0d0d] p-7 transition-colors hover:border-[#c9a84c]/50"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]">
                {r.eyebrow}
              </span>
              <h3 className="mt-3 font-serif text-xl text-[#f5f3ee] group-hover:text-[#f0d78c] transition-colors">
                {r.name}
              </h3>
              <p className="mt-2 text-sm text-[#f5f3ee]/50 font-light line-clamp-3">
                {r.hero}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Ready to run your rentals"
        emphasis="properly?"
        sub="Start on the free plan. No card required, and your first property takes minutes to set up."
      />
    </MarketingLayout>
  );
};

export default ProductPage;
