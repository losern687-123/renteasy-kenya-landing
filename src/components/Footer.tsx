import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">RentEasy Kenya</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Simplifying rent management for landlords and tenants across Kenya.
            </p>
            <div className="flex gap-3 pt-2">
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Home
                </a>
              </li>
              <li>
                <a href="/auth" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Login
                </a>
              </li>
              <li>
                <a href="/auth" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Register
                </a>
              </li>
              <li>
                <a href="/admin/login" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-xs">
                  Admin Login
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} RentEasy Kenya. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
