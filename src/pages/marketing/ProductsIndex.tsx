import { Link } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import Seo from "@/components/marketing/Seo";
import {
  Section,
  SectionHeading,
  CtaBand,
  Reveal,
  goldButton,
  ghostButton,
} from "@/components/marketing/sections";
import { products } from "@/content/products";
import heroEstate from "@/assets/hero-estate.jpg";

const ProductsIndex = () => (
  <MarketingLayout>
    <Seo
      title="Property Management Solutions | RentEasy Kenya"
      description="Rent tracking, tenant management, a rental marketplace, analytics, bulk operations and messaging — everything Kenyan landlords need in one platform."
      path="/products"
    />

    <section className="relative overflow-hidden border-b border-primary/10">
      <img
        src={heroEstate}
        alt="Modern Nairobi residential estate"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-hero-h)" }} />
      <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-hero-v)" }} />
      <div className="relative z-10 px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-4xl">
        <span className="block text-[10px] uppercase tracking-[0.4em] text-primary mb-6">
          — The Platform
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] on-veil">
          Everything a Kenyan landlord needs,{" "}
          <span className="italic font-light text-accent">in one place</span>
        </h1>
        <p className="mt-6 max-w-xl on-veil-muted font-light leading-relaxed">
          From the first listing to the last receipt — rent collection, tenancies,
          a public marketplace, reporting and the conversations in between.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link to="/auth" className={goldButton}>
            Start Free
          </Link>
          <Link to="/pricing" className={ghostButton}>
            View Pricing
          </Link>
        </div>
      </div>
    </section>

    <Section>
      <Reveal>
        <SectionHeading
          eyebrow="Solutions"
          title="Explore the platform"
          subtitle="Each capability works on its own and better together."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.slug}
              to={`/products/${p.slug}`}
              className="group flex flex-col border border-primary/15 bg-card p-8 transition-colors hover:border-primary/50"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-primary">
                {p.eyebrow}
              </span>
              <h2 className="mt-4 font-serif text-2xl text-foreground group-hover:text-accent transition-colors">
                {p.name}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/55 font-light">
                {p.hero}
              </p>
              <span className="mt-6 text-[10px] uppercase tracking-[0.3em] text-primary">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </Reveal>
    </Section>

    <CtaBand
      title="See it with your own"
      emphasis="portfolio"
      sub="The free plan covers five properties and ten tenants — enough to run a real building."
    />
  </MarketingLayout>
);

export default ProductsIndex;
