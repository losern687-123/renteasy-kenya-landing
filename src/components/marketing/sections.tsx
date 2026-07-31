import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const goldButton =
  "inline-flex items-center justify-center min-h-[48px] px-8 sm:px-10 bg-[#c9a84c] text-[#0d0d0d] text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#f0d78c] transition-colors";

export const ghostButton =
  "inline-flex items-center justify-center min-h-[48px] px-8 sm:px-10 border border-[#c9a84c]/40 text-[#f5f3ee] text-[10px] uppercase tracking-[0.3em] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors";

export const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);

export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="max-w-2xl mb-12">
    {eyebrow && (
      <span className="block text-[10px] uppercase tracking-[0.4em] text-[#c9a84c] mb-4">
        {eyebrow}
      </span>
    )}
    <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] text-[#f5f3ee]">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-4 text-[#f5f3ee]/55 font-light leading-relaxed">{subtitle}</p>
    )}
  </div>
);

export const MarketingHero = ({
  eyebrow,
  headline,
  emphasis,
  sub,
  image,
  imageAlt,
}: {
  eyebrow: string;
  headline: string;
  emphasis?: string;
  sub: string;
  image?: string;
  imageAlt?: string;
}) => (
  <section className="relative w-full overflow-hidden border-b border-[#c9a84c]/10 bg-[#0d0d0d]">
    {image && (
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt={imageAlt || ""}
          className="h-full w-full object-cover opacity-30"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-[#0d0d0d]/60" />
      </div>
    )}
    <div className="relative z-10 px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-4xl">
      <span className="block text-[10px] uppercase tracking-[0.4em] text-[#c9a84c] mb-6">
        — {eyebrow}
      </span>
      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] text-[#f5f3ee]">
        {headline}
        {emphasis && (
          <>
            {" "}
            <span className="italic font-light text-[#f0d78c]">{emphasis}</span>
          </>
        )}
      </h1>
      <p className="mt-6 max-w-xl text-[#f5f3ee]/60 font-light leading-relaxed">
        {sub}
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <Link to="/pricing" className={goldButton}>
          View Pricing
        </Link>
        <Link to="/auth" className={ghostButton}>
          Get Started
        </Link>
      </div>
    </div>
  </section>
);

export const BenefitsGrid = ({
  benefits,
}: {
  benefits: { title: string; text: string }[];
}) => (
  <div className="grid gap-px bg-[#c9a84c]/10 sm:grid-cols-2 lg:grid-cols-3 border border-[#c9a84c]/10">
    {benefits.map((b) => (
      <div key={b.title} className="bg-[#0d0d0d] p-7">
        <Check className="h-4 w-4 text-[#c9a84c]" />
        <h3 className="mt-4 font-serif text-xl text-[#f5f3ee]">{b.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#f5f3ee]/55 font-light">
          {b.text}
        </p>
      </div>
    ))}
  </div>
);

export const FeatureCards = ({
  features,
}: {
  features: { title: string; text: string; badge?: string }[];
}) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {features.map((f) => (
      <div
        key={f.title}
        className="group border border-[#c9a84c]/15 bg-[#141414] p-7 transition-colors hover:border-[#c9a84c]/45"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl text-[#f5f3ee]">{f.title}</h3>
          {f.badge && (
            <span className="shrink-0 border border-[#c9a84c]/40 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-[#c9a84c]">
              {f.badge}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#f5f3ee]/55 font-light">
          {f.text}
        </p>
      </div>
    ))}
  </div>
);

export const UseCaseCards = ({
  cases,
}: {
  cases: { label: string; quote: string; author: string }[];
}) => (
  <div className="grid gap-6 md:grid-cols-3">
    {cases.map((c) => (
      <figure
        key={c.author}
        className="flex flex-col border border-[#c9a84c]/15 bg-[#141414] p-7"
      >
        <span className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]">
          {c.label}
        </span>
        <blockquote className="mt-5 flex-1 font-serif text-lg italic leading-relaxed text-[#f5f3ee]/85">
          “{c.quote}”
        </blockquote>
        <figcaption className="mt-6 text-[10px] uppercase tracking-[0.25em] text-[#f5f3ee]/45">
          {c.author}
        </figcaption>
      </figure>
    ))}
  </div>
);

export type TierValue = true | false | string;

export const TierCell = ({ value }: { value: TierValue }) => {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-[#c9a84c]" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-[#f5f3ee]/20" />;
  if (!value) return <Minus className="mx-auto h-4 w-4 text-[#f5f3ee]/20" />;
  return <span className="text-xs text-[#f5f3ee]/70">{value}</span>;
};

export const TierAvailability = ({
  rows,
}: {
  rows: { feature: string; free: TierValue; pro: TierValue; enterprise: TierValue }[];
}) => (
  <div className="overflow-x-auto border border-[#c9a84c]/15">
    <table className="w-full min-w-[560px] text-left">
      <thead>
        <tr className="border-b border-[#c9a84c]/15 bg-[#141414]">
          <th className="p-4 text-[10px] uppercase tracking-[0.25em] text-[#c9a84c]">
            Capability
          </th>
          {["Free", "Professional", "Enterprise"].map((t) => (
            <th
              key={t}
              className="p-4 text-center text-[10px] uppercase tracking-[0.25em] text-[#c9a84c]"
            >
              {t}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.feature} className="border-b border-[#c9a84c]/10 last:border-0">
            <td className="p-4 text-sm text-[#f5f3ee]/80">{r.feature}</td>
            <td className="p-4 text-center">
              <TierCell value={r.free} />
            </td>
            <td className="p-4 text-center">
              <TierCell value={r.pro} />
            </td>
            <td className="p-4 text-center">
              <TierCell value={r.enterprise} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const FaqAccordion = ({ faqs }: { faqs: { q: string; a: string }[] }) => (
  <Accordion type="single" collapsible className="border-t border-[#c9a84c]/15">
    {faqs.map((f, i) => (
      <AccordionItem
        key={i}
        value={`item-${i}`}
        className="border-b border-[#c9a84c]/15"
      >
        <AccordionTrigger className="py-5 text-left font-serif text-lg text-[#f5f3ee] hover:text-[#c9a84c] hover:no-underline">
          {f.q}
        </AccordionTrigger>
        <AccordionContent className="pb-6 text-sm leading-relaxed text-[#f5f3ee]/60 font-light">
          {f.a}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export const CtaBand = ({
  title,
  emphasis,
  sub,
}: {
  title: string;
  emphasis?: string;
  sub?: string;
}) => (
  <section className="border-t border-[#c9a84c]/10 bg-[#0d0d0d] px-6 md:px-12 py-24 text-center">
    <div className="mx-auto max-w-2xl">
      <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] text-[#f5f3ee]">
        {title}
        {emphasis && (
          <>
            {" "}
            <span className="italic text-[#f0d78c]">{emphasis}</span>
          </>
        )}
      </h2>
      {sub && (
        <p className="mx-auto mt-5 max-w-lg text-[#f5f3ee]/55 font-light">{sub}</p>
      )}
      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
        <Link to="/auth" className={goldButton}>
          Start Free
        </Link>
        <Link to="/pricing" className={ghostButton}>
          Compare Plans
        </Link>
      </div>
    </div>
  </section>
);

export const Section = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`px-6 md:px-12 lg:px-20 py-16 md:py-24 ${className}`}>
    <div className="mx-auto max-w-6xl">{children}</div>
  </section>
);
