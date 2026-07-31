import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuxuryNav } from "@/components/landing/LuxuryNav";

const productLinks = [
  { name: "Rent Tracking", to: "/products/rent-tracking" },
  { name: "Tenant Management", to: "/products/tenant-management" },
  { name: "Marketplace", to: "/products/marketplace" },
  { name: "Analytics & Reports", to: "/products/analytics" },
  { name: "Bulk Operations", to: "/products/bulk-operations" },
  { name: "Messaging", to: "/products/messaging" },
];

const companyLinks = [
  { name: "Pricing", to: "/pricing" },
  { name: "Compare Plans", to: "/pricing/compare" },
  { name: "Professional Services", to: "/products/services" },
  { name: "Resources", to: "/resources" },
  { name: "Newsletter", to: "/newsletter" },
];

const accountLinks = [
  { name: "Browse Marketplace", to: "/marketplace" },
  { name: "Sign In", to: "/auth" },
  { name: "Join Waitlist", to: "/waitlist" },
];

export const MarketingFooter = () => (
  <footer className="w-full bg-[#0d0d0d] border-t border-[#c9a84c]/15 px-6 md:px-12 py-16">
    <div className="max-w-6xl mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <Link
          to="/"
          className="font-serif text-xl tracking-[0.2em] text-[#c9a84c]"
        >
          RENTEASY <span className="italic font-light">Kenya</span>
        </Link>
        <p className="mt-4 text-sm leading-relaxed text-[#f5f3ee]/50 font-light">
          Property management and a curated rental marketplace for Kenya's
          landlords, tenants and property seekers.
        </p>
      </div>

      {[
        { title: "Platform", links: productLinks },
        { title: "Company", links: companyLinks },
        { title: "Get Started", links: accountLinks },
      ].map((col) => (
        <div key={col.title}>
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] mb-5">
            {col.title}
          </h3>
          <ul className="space-y-3">
            {col.links.map((l) => (
              <li key={l.name}>
                <Link
                  to={l.to}
                  className="text-sm text-[#f5f3ee]/60 hover:text-[#c9a84c] transition-colors"
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="max-w-6xl mx-auto mt-14 pt-8 border-t border-[#c9a84c]/10 text-[9px] uppercase tracking-[0.35em] text-[#c9a84c]/40">
      © {new Date().getFullYear()} RentEasy Kenya
    </div>
  </footer>
);

export const MarketingLayout = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const prev = document.documentElement.style.colorScheme;
    document.documentElement.style.colorScheme = "dark";
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.colorScheme = prev;
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0d0d0d] text-[#f5f3ee]"
      style={{ fontFamily: "'Karla', system-ui, sans-serif" }}
    >
      <div className="relative">
        <LuxuryNav />
      </div>
      <main className="pt-24 md:pt-28">{children}</main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;
