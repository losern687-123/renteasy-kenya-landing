import { HeroVeil } from "@/components/shared/HeroVeil";
import heroCompare from "@/assets/neighborhood-kilimani.jpg";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import Seo from "@/components/marketing/Seo";
import {
  Section,
  TierCell,
  CtaBand,
  Reveal,
} from "@/components/marketing/sections";
import { comparisonGroups, tiers } from "@/content/pricing";

const columns = ["free", "starter", "pro", "enterprise"] as const;

const ComparePage = () => (
  <MarketingLayout>
    <Seo
      title="Compare plans — RentEasy Kenya feature comparison"
      description="Side-by-side comparison of Free, Starter, Professional and Enterprise plans: limits, rent tools, analytics, bulk operations and support."
      path="/pricing/compare"
    />

    <Section className="relative isolate overflow-hidden !pt-32 md:!pt-40 !pb-20 md:!pb-24">
      <HeroVeil image={heroCompare} />
      <span className="block text-[10px] uppercase tracking-[0.4em] text-primary mb-6">
        — Full comparison
      </span>
      <h1 className="max-w-3xl font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] on-veil">
        Every feature,{" "}
        <span className="italic font-light text-accent">side by side</span>
      </h1>
      <p className="mt-6 max-w-xl on-veil-muted font-light leading-relaxed">
        A complete breakdown of what each plan includes, so you can pick once and
        move on.
      </p>
      <Link
        to="/pricing"
        className="mt-8 inline-block text-[10px] uppercase tracking-[0.3em] text-primary hover:text-accent transition-colors"
      >
        ← Back to pricing
      </Link>
    </Section>

    <Section className="!pt-10">
      <Reveal>
        <div className="overflow-x-auto border border-primary/15">
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0">
              <tr className="border-b border-primary/20 bg-card">
                <th className="p-4 text-[10px] uppercase tracking-[0.25em] text-primary">
                  Feature
                </th>
                {tiers.map((t) => (
                  <th key={t.slug} className="p-4 text-center">
                    <span className="block font-serif text-lg text-foreground">
                      {t.name}
                    </span>
                    <span className="mt-1 block text-[9px] uppercase tracking-[0.2em] text-primary">
                      {t.monthly === 0
                        ? "Free"
                        : `KES ${t.monthly.toLocaleString()}/mo`}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonGroups.map((g) => (
                <Fragment key={g.group}>
                  <tr className="bg-card">
                    <td
                      colSpan={5}
                      className="p-3 text-[10px] uppercase tracking-[0.3em] text-primary"
                    >
                      {g.group}
                    </td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr
                      key={g.group + r.feature}
                      className="border-b border-primary/10 last:border-0 hover:bg-card/60 transition-colors"
                    >
                      <td className="p-4 text-sm text-foreground/80">{r.feature}</td>
                      {columns.map((c) => (
                        <td key={c} className="p-4 text-center">
                          <TierCell value={r[c]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>

    <CtaBand
      title="Not sure which plan"
      emphasis="fits?"
      sub="Start free — you can move up or down at any time and the new limits apply immediately."
    />
  </MarketingLayout>
);

export default ComparePage;
