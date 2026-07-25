import { Link } from "react-router-dom";

export const LuxuryCTA = () => {
  return (
    <section className="w-full bg-[#0d0d0d] py-24 md:py-32 px-6 md:px-12 border-t border-[#c9a84c]/10 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-serif text-4xl md:text-6xl text-[#f5f3ee] mb-6 leading-[1.05]">
          Experience the <span className="italic text-[#f0d78c]">Difference</span>
        </h2>
        <p className="text-[#f5f3ee]/60 font-light max-w-lg mx-auto mb-12">
          Join the private waitlist for early access to Nairobi's most sought-after
          residences and full-service property management.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/marketplace"
            className="px-12 py-5 bg-[#c9a84c] text-[#0d0d0d] text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#f0d78c] transition-all"
          >
            Browse Listings
          </Link>
          <Link
            to="/waitlist"
            className="px-12 py-5 border border-[#c9a84c]/40 text-[#f5f3ee] text-[10px] uppercase tracking-[0.3em] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all"
          >
            Join the Waitlist
          </Link>
        </div>
        <div className="mt-24 text-[9px] uppercase tracking-[0.4em] text-[#c9a84c]/40">
          © {new Date().getFullYear()} RentEasy Kenya · Curating Nairobi's Finest
        </div>
      </div>
    </section>
  );
};
