import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userRole, isApprovedLandlord, landlordStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Build navigation links based on user role and status
  const getNavLinks = () => {
    const links = [{ name: "Home", path: "/" }];
    
    if (user) {
      if (userRole === 'tenant') {
        links.push({ name: "Dashboard", path: "/tenant-dashboard" });
        links.push({ name: "Apply as Landlord", path: "/apply-landlord" });
      } else if (userRole === 'landlord') {
        if (isApprovedLandlord) {
          links.push({ name: "Dashboard", path: "/landlord-dashboard" });
        } else if (landlordStatus === 'pending') {
          links.push({ name: "Verification Status", path: "/landlord/pending" });
        } else if (landlordStatus === 'rejected') {
          links.push({ name: "Application Status", path: "/landlord/rejected" });
        }
      } else if (userRole === 'admin') {
        links.push({ name: "Admin Dashboard", path: "/admin/dashboard" });
      }
    }
    
    links.push({ name: "Waitlist", path: "/waitlist" });
    
    return links;
  };

  const navLinks = getNavLinks();

  const isActivePath = (path: string) => {
    if (path.startsWith("/#")) return false;
    return location.pathname === path;
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-lg shadow-md border-b border-border/50"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-hero flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-white font-bold text-lg sm:text-xl">RE</span>
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  RentEasy Kenya
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative text-sm font-medium transition-colors hover:text-primary story-link",
                    isActivePath(link.path)
                      ? "text-primary font-semibold"
                      : "text-foreground/80"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <>
                  <NotificationBell />
                  <ProfileDropdown />
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" className="hover-scale">
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile/Tablet Actions */}
            <div className="lg:hidden flex items-center gap-2">
              {user && <NotificationBell />}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover-scale h-10 w-10 touch-manipulation"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-14 sm:top-16 left-0 right-0 bottom-0 bg-background z-40 lg:hidden transition-transform duration-300 ease-out overflow-y-auto",
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200 touch-manipulation active:scale-[0.98]",
                  isActivePath(link.path)
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-base">{link.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {user ? (
                <ProfileDropdown mobile />
              ) : (
                <Link to="/auth" onClick={handleLinkClick}>
                  <Button 
                    className="w-full py-6 text-base font-semibold rounded-xl touch-manipulation active:scale-[0.98]"
                  >
                    Login / Sign Up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile-specific quick actions */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 px-4">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/auth"
                  onClick={handleLinkClick}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-lg">🏠</span>
                  </div>
                  <span className="text-sm font-medium">For Tenants</span>
                </Link>
                <Link
                  to="/auth"
                  onClick={handleLinkClick}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors touch-manipulation active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-secondary text-lg">🔑</span>
                  </div>
                  <span className="text-sm font-medium">For Landlords</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Need to import this for the mobile menu button
const ArrowRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
