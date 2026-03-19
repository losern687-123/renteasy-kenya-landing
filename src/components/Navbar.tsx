import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

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
          "sticky top-0 z-50 w-full transition-all duration-300 h-[72px]",
          isScrolled
            ? "bg-background shadow-sm border-b border-border"
            : "bg-background"
        )}
      >
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RE</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                RentEasy Kenya
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActivePath(link.path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle variant="icon" />
              {user ? (
                <>
                  <NotificationBell />
                  <ProfileDropdown />
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button className="text-sm font-medium">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle variant="icon" />
              {user && <NotificationBell />}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-10 w-10 touch-manipulation"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 z-40 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-[72px] left-0 right-0 bottom-0 bg-background z-40 lg:hidden transition-transform duration-300 ease-out overflow-y-auto",
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg transition-colors touch-manipulation",
                  isActivePath(link.path)
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="text-base">{link.name}</span>
              </Link>
            ))}

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {user ? (
                <ProfileDropdown mobile />
              ) : (
                <div className="space-y-2">
                  <Link to="/auth" onClick={handleLinkClick}>
                    <Button variant="outline" className="w-full py-5 text-base font-medium touch-manipulation">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={handleLinkClick}>
                    <Button className="w-full py-5 text-base font-medium touch-manipulation">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
