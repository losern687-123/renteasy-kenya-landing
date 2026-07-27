import { Link } from "react-router-dom";

export const LuxuryNav = () => {
  return (
    <nav className="absolute top-0 inset-x-0 z-50 w-full flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#c9a84c]/10">
      <Link to="/" className="text-xl md:text-2xl tracking-[0.25em] text-[#c9a84c] font-serif">
        RENTEASY <span className="italic font-light">Kenya</span>
      </Link>
      <div className="hidden lg:flex space-x-10 text-[10px] uppercase tracking-[0.3em] font-medium text-[#f5f3ee]/80">
        <Link to="/marketplace" className="hover:text-[#c9a84c] transition-colors">Marketplace</Link>
        <a href="#neighborhoods" className="hover:text-[#c9a84c] transition-colors">Neighborhoods</a>
        <a href="#experience" className="hover:text-[#c9a84c] transition-colors">Experience</a>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/auth"
          className="hidden sm:inline-block text-[10px] uppercase tracking-[0.3em] text-[#f5f3ee]/70 hover:text-[#c9a84c] transition-colors"
        >
          Sign In
        </Link>
        <Link
          to="/waitlist"
          className="px-5 md:px-8 py-2.5 border border-[#c9a84c] text-[#c9a84c] text-[10px] uppercase tracking-[0.2em] hover:bg-[#c9a84c] hover:text-[#0d0d0d] transition-all duration-500"
        >
          Join Waitlist
        </Link>
      </div>
    </nav>
  );
};
