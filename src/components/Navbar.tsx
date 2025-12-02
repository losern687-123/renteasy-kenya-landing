import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
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
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg shadow-md border-b border-border/50"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-white font-bold text-xl">RE</span>
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                RentEasy Kenya
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
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
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {user && <NotificationBell />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hover-scale"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isMobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-2 pt-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors hover:bg-muted",
                  isActivePath(link.path)
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80"
                )}
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
              {user ? (
                <ProfileDropdown mobile />
              ) : (
                <>
                  <Link to="/auth" onClick={handleLinkClick}>
                    <Button variant="ghost" className="w-full">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
