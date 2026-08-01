import { useParams, Navigate, Link } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import Seo from "@/components/marketing/Seo";
import { Section, CtaBand } from "@/components/marketing/sections";
import { articleBySlug, articles } from "@/content/blog";

const ArticlePage = () => {
  const { slug } = useParams();
  const article = articleBySlug(slug);

  if (!article) return <Navigate to="/resources" replace />;

  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <MarketingLayout>
      <Seo
        title={`${article.title} | RentEasy Kenya`}
        description={article.description}
        path={`/resources/blog/${article.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: article.title,
          description: article.description,
          datePublished: article.date,
          articleSection: article.category,
          author: { "@type": "Organization", name: "RentEasy Kenya" },
        }}
      />

      <article>
        <Section className="pb-6">
          <Link
            to="/resources"
            className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] hover:text-[#f0d78c] transition-colors"
          >
            ← All resources
          </Link>
          <span className="mt-8 block text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
            — {article.category}
          </span>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.03] text-[#f5f3ee]">
            {article.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[#f5f3ee]/60 font-light leading-relaxed">
            {article.description}
          </p>
          <div className="mt-8 flex gap-6 border-t border-[#c9a84c]/15 pt-6 text-[10px] uppercase tracking-[0.25em] text-[#f5f3ee]/40">
            <span>
              {new Date(article.date).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>{article.readTime}</span>
          </div>
        </Section>

        <Section className="pt-0">
          <div className="max-w-3xl">
            {article.body.map((block, i) => (
              <div key={i} className="mb-10 last:mb-0">
                {block.heading && (
                  <h2 className="mb-4 font-serif text-2xl md:text-3xl text-[#f0d78c]">
                    {block.heading}
                  </h2>
                )}
                {block.paragraphs.map((p, j) => (
                  <p
                    key={j}
                    className="mb-4 text-[#f5f3ee]/70 font-light leading-[1.85]"
                  >
                    {p}
                  </p>
                ))}
                {block.list && (
                  <ul className="mt-5 space-y-3 border-l border-[#c9a84c]/30 pl-6">
                    {block.list.map((item) => (
                      <li
                        key={item}
                        className="text-sm text-[#f5f3ee]/60 font-light leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      </article>

      <Section className="bg-[#111111] border-y border-[#c9a84c]/10">
        <h2 className="mb-8 text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
          Keep reading
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              to={`/resources/blog/${r.slug}`}
              className="group border border-[#c9a84c]/15 bg-[#0d0d0d] p-7 transition-colors hover:border-[#c9a84c]/50"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]">
                {r.category}
              </span>
              <h3 className="mt-3 font-serif text-xl text-[#f5f3ee] group-hover:text-[#f0d78c] transition-colors">
                {r.title}
              </h3>
              <p className="mt-2 text-sm text-[#f5f3ee]/50 font-light line-clamp-3">
                {r.description}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Run your rentals"
        emphasis="properly."
        sub="Rent invoicing, online payments and receipts — free for your first five properties."
      />
    </MarketingLayout>
  );
};

export default ArticlePage;
