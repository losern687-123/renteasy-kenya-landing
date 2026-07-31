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

    <section className="relative overflow-hidden border-b border-[#c9a84c]/10">
      <img
        src={heroEstate}
        alt="Modern Nairobi residential estate"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/85 to-[#0d0d0d]/60" />
      <div className="relative z-10 px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-4xl">
        <span className="block text-[10px] uppercase tracking-[0.4em] text-[#c9a84c] mb-6">
          — The Platform
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02]">
          Everything a Kenyan landlord needs,{" "}
          <span className="italic font-light text-[#f0d78c]">in one place</span>
        </h1>
        <p className="mt-6 max-w-xl text-[#f5f3ee]/60 font-light leading-relaxed">
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
              className="group flex flex-col border border-[#c9a84c]/15 bg-[#141414] p-8 transition-colors hover:border-[#c9a84c]/50"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]">
                {p.eyebrow}
              </span>
              <h2 className="mt-4 font-serif text-2xl text-[#f5f3ee] group-hover:text-[#f0d78c] transition-colors">
                {p.name}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#f5f3ee]/55 font-light">
                {p.hero}
              </p>
              <span className="mt-6 text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]">
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
