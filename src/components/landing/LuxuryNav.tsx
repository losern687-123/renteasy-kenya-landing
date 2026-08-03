import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Marketplace", to: "/marketplace", type: "route" as const },
  { name: "Solutions", to: "/products", type: "route" as const },
  { name: "Pricing", to: "/pricing", type: "route" as const },
  { name: "Resources", to: "/resources", type: "route" as const },
];


export const LuxuryNav = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass =
    "relative text-[10px] uppercase tracking-[0.3em] font-medium on-veil-muted hover:text-primary transition-colors duration-300 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100 motion-reduce:after:hidden";

  return (
    <>
      <nav className="absolute top-0 inset-x-0 z-50 w-full border-b border-primary/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundImage: "var(--veil-nav)" }}
        />
        <div className="flex items-center justify-between px-5 md:px-12 py-4 md:py-6">
        <Link
          to="/"
          className="text-base sm:text-lg md:text-2xl tracking-[0.2em] md:tracking-[0.25em] text-accent font-serif whitespace-nowrap"
        >
          RENTEASY <span className="italic font-light">Kenya</span>
        </Link>

        <div className="hidden lg:flex items-center space-x-10">
          {navItems.map((item) =>
            item.type === "route" ? (
              <Link key={item.name} to={item.to} className={linkClass}>
                {item.name}
              </Link>
            ) : (
              <a key={item.name} href={item.to} className={linkClass}>
                {item.name}
              </a>
            )
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:block">
            <ThemeToggle variant="icon" />
          </div>
          {user ? (
            <div className="hidden md:block">
              <ProfileDropdown />
            </div>
          ) : (
            <>
              <Link
                to="/auth"
                className={cn("hidden md:inline-block", linkClass)}
              >
                Sign In
              </Link>
              <Link
                to="/waitlist"
                className="hidden md:inline-block px-5 md:px-8 py-2.5 border border-accent text-accent text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-background transition-all duration-500 motion-reduce:transition-none"
              >
                Join Waitlist
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center h-11 w-11 border border-primary/30 text-primary hover:bg-primary/10 transition-colors touch-manipulation"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden bg-background/95 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      >
        <div
          className={cn(
            "absolute top-[68px] inset-x-0 bg-background border-t border-primary/15 px-6 py-8 transition-transform duration-300",
            open ? "translate-y-0" : "-translate-y-4"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-5 mb-8">
            {navItems.map((item) =>
              item.type === "route" ? (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="text-[11px] uppercase tracking-[0.3em] text-foreground/85 hover:text-primary py-2"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.to}
                  onClick={() => setOpen(false)}
                  className="text-[11px] uppercase tracking-[0.3em] text-foreground/85 hover:text-primary py-2"
                >
                  {item.name}
                </a>
              )
            )}
          </div>

          <div className="flex items-center justify-between border-t border-primary/15 pt-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
              Theme
            </span>
            <ThemeToggle variant="icon" />
          </div>

          {user ? (
            <div className="mt-6 border-t border-primary/15 pt-6">
              <ProfileDropdown mobile />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="w-full text-center py-3 border border-primary/40 text-foreground text-[11px] uppercase tracking-[0.3em] hover:border-primary hover:text-primary transition-colors touch-manipulation"
              >
                Sign In
              </Link>
              <Link
                to="/waitlist"
                onClick={() => setOpen(false)}
                className="w-full text-center py-3 bg-primary text-background text-[11px] uppercase tracking-[0.3em] hover:bg-accent transition-colors touch-manipulation"
              >
                Join Waitlist
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
