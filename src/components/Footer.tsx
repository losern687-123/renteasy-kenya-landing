import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Login", href: "/auth" },
    { name: "Register", href: "/auth" },
    { name: "Waitlist", href: "/waitlist" },
  ];

  const companyLinks = [
    { name: "About Us", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10 sm:py-12 md:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
                <span className="text-white font-bold text-sm">RE</span>
              </div>
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                RentEasy
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Simplifying rent management for landlords and tenants across Kenya.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-2 pt-2">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href} 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center touch-manipulation active:scale-95"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-block touch-manipulation"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">Company</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-sm">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-block touch-manipulation"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="mailto:hello@renteasy.co.ke" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 touch-manipulation"
                >
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>hello@renteasy.co.ke</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+254700000000" 
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 touch-manipulation"
                >
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>+254 700 000 000</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <p className="text-center sm:text-left">
              © {currentYear} RentEasy Kenya. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {legalLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href} 
                  className="hover:text-primary transition-colors duration-200 touch-manipulation"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
          
          {/* Admin Login - small and subtle */}
          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            <Link 
              to="/admin/login" 
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
