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

    <Section className="pb-6">
      <span className="block text-[10px] uppercase tracking-[0.4em] text-[#c9a84c] mb-6">
        — Full comparison
      </span>
      <h1 className="max-w-3xl font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] text-[#f5f3ee]">
        Every feature,{" "}
        <span className="italic font-light text-[#f0d78c]">side by side</span>
      </h1>
      <p className="mt-6 max-w-xl text-[#f5f3ee]/60 font-light leading-relaxed">
        A complete breakdown of what each plan includes, so you can pick once and
        move on.
      </p>
      <Link
        to="/pricing"
        className="mt-8 inline-block text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] hover:text-[#f0d78c] transition-colors"
      >
        ← Back to pricing
      </Link>
    </Section>

    <Section className="pt-4">
      <Reveal>
        <div className="overflow-x-auto border border-[#c9a84c]/15">
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0">
              <tr className="border-b border-[#c9a84c]/20 bg-[#141414]">
                <th className="p-4 text-[10px] uppercase tracking-[0.25em] text-[#c9a84c]">
                  Feature
                </th>
                {tiers.map((t) => (
                  <th key={t.slug} className="p-4 text-center">
                    <span className="block font-serif text-lg text-[#f5f3ee]">
                      {t.name}
                    </span>
                    <span className="mt-1 block text-[9px] uppercase tracking-[0.2em] text-[#c9a84c]">
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
                <>
                  <tr key={g.group} className="bg-[#111111]">
                    <td
                      colSpan={5}
                      className="p-3 text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]"
                    >
                      {g.group}
                    </td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr
                      key={g.group + r.feature}
                      className="border-b border-[#c9a84c]/10 last:border-0 hover:bg-[#141414]/60 transition-colors"
                    >
                      <td className="p-4 text-sm text-[#f5f3ee]/80">{r.feature}</td>
                      {columns.map((c) => (
                        <td key={c} className="p-4 text-center">
                          <TierCell value={r[c]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
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
