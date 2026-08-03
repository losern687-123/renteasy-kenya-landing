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
  "inline-flex items-center justify-center min-h-[48px] px-8 sm:px-10 bg-primary text-background text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-accent transition-colors";

export const ghostButton =
  "inline-flex items-center justify-center min-h-[48px] px-8 sm:px-10 border border-primary/40 text-foreground text-[10px] uppercase tracking-[0.3em] hover:border-primary hover:text-primary transition-colors";

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
      <span className="block text-[10px] uppercase tracking-[0.4em] text-primary mb-4">
        {eyebrow}
      </span>
    )}
    <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] text-foreground">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-4 text-foreground/55 font-light leading-relaxed">{subtitle}</p>
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
  <section className="relative w-full overflow-hidden border-b border-primary/10 bg-background">
    {image && (
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt={imageAlt || ""}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-hero-h)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-hero-v)" }} />
      </div>
    )}
    <div className="relative z-10 px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-4xl">
      <span className="block text-[10px] uppercase tracking-[0.4em] text-primary mb-6">
        — {eyebrow}
      </span>
      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] on-veil">
        {headline}
        {emphasis && (
          <>
            {" "}
            <span className="italic font-light text-accent">{emphasis}</span>
          </>
        )}
      </h1>
      <p className="mt-6 max-w-xl on-veil-muted font-light leading-relaxed">
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
  <div className="grid gap-px bg-primary/10 sm:grid-cols-2 lg:grid-cols-3 border border-primary/10">
    {benefits.map((b) => (
      <div key={b.title} className="bg-background p-7">
        <Check className="h-4 w-4 text-primary" />
        <h3 className="mt-4 font-serif text-xl text-foreground">{b.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/55 font-light">
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
        className="group border border-primary/15 bg-card p-7 transition-colors hover:border-primary/45"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl text-foreground">{f.title}</h3>
          {f.badge && (
            <span className="shrink-0 border border-primary/40 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-primary">
              {f.badge}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground/55 font-light">
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
        className="flex flex-col border border-primary/15 bg-card p-7"
      >
        <span className="text-[9px] uppercase tracking-[0.3em] text-primary">
          {c.label}
        </span>
        <blockquote className="mt-5 flex-1 font-serif text-lg italic leading-relaxed text-foreground/85">
          “{c.quote}”
        </blockquote>
        <figcaption className="mt-6 text-[10px] uppercase tracking-[0.25em] text-foreground/45">
          {c.author}
        </figcaption>
      </figure>
    ))}
  </div>
);

export type TierValue = true | false | string;

export const TierCell = ({ value }: { value: TierValue }) => {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-primary" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-foreground/20" />;
  if (!value) return <Minus className="mx-auto h-4 w-4 text-foreground/20" />;
  return <span className="text-xs text-foreground/70">{value}</span>;
};

export const TierAvailability = ({
  rows,
}: {
  rows: { feature: string; free: TierValue; pro: TierValue; enterprise: TierValue }[];
}) => (
  <div className="overflow-x-auto border border-primary/15">
    <table className="w-full min-w-[560px] text-left">
      <thead>
        <tr className="border-b border-primary/15 bg-card">
          <th className="p-4 text-[10px] uppercase tracking-[0.25em] text-primary">
            Capability
          </th>
          {["Free", "Professional", "Enterprise"].map((t) => (
            <th
              key={t}
              className="p-4 text-center text-[10px] uppercase tracking-[0.25em] text-primary"
            >
              {t}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.feature} className="border-b border-primary/10 last:border-0">
            <td className="p-4 text-sm text-foreground/80">{r.feature}</td>
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
  <Accordion type="single" collapsible className="border-t border-primary/15">
    {faqs.map((f, i) => (
      <AccordionItem
        key={i}
        value={`item-${i}`}
        className="border-b border-primary/15"
      >
        <AccordionTrigger className="py-5 text-left font-serif text-lg text-foreground hover:text-primary hover:no-underline">
          {f.q}
        </AccordionTrigger>
        <AccordionContent className="pb-6 text-sm leading-relaxed text-foreground/60 font-light">
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
  <section className="border-t border-primary/10 bg-background px-6 md:px-12 py-24 text-center">
    <div className="mx-auto max-w-2xl">
      <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] text-foreground">
        {title}
        {emphasis && (
          <>
            {" "}
            <span className="italic text-accent">{emphasis}</span>
          </>
        )}
      </h2>
      {sub && (
        <p className="mx-auto mt-5 max-w-lg text-foreground/55 font-light">{sub}</p>
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
