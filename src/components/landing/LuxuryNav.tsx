import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const LuxuryNav = () => {
  const { user } = useAuth();

  return (
    <nav className="absolute top-0 inset-x-0 z-50 w-full flex items-center justify-between px-6 md:px-12 py-6 border-b border-primary/10">
      <Link
        to="/"
        className="text-xl md:text-2xl tracking-[0.25em] text-primary font-serif transition-opacity duration-500 hover:opacity-80"
      >
        RENTEASY <span className="italic font-light">Kenya</span>
      </Link>

      <div className="hidden lg:flex space-x-10 text-[10px] uppercase tracking-[0.3em] font-medium text-foreground/80">
        <Link to="/marketplace" className="gold-underline hover-gold">Marketplace</Link>
        <a href="#neighborhoods" className="gold-underline hover-gold">Neighborhoods</a>
        <a href="#experience" className="gold-underline hover-gold">Experience</a>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle variant="icon" />
        {user ? (
          <>
            <NotificationBell />
            <ProfileDropdown />
          </>
        ) : (
          <>
            <Link
              to="/auth"
              className="hidden sm:inline-block text-[10px] uppercase tracking-[0.3em] text-foreground/70 hover-gold"
            >
              Sign In
            </Link>
            <Link
              to="/waitlist"
              className="px-5 md:px-8 py-2.5 border border-primary text-primary text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all duration-500"
            >
              Join Waitlist
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
