import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="RentEasy Kenya Hero Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20 mx-auto text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-md border border-primary/20">
            <span className="text-sm font-medium text-primary-foreground">
              🇰🇪 Made for Kenya
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight">
            Never forget rent day again
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto font-medium">
            Simplify rent tracking with RentEasy Kenya
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              size="lg" 
              className="bg-background text-primary hover:bg-background/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg px-8 py-6 rounded-xl font-semibold"
            >
              Sign Up as Tenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-primary-foreground/10 backdrop-blur-md border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg px-8 py-6 rounded-xl font-semibold"
            >
              Sign Up as Landlord
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-12 flex items-center justify-center gap-8 text-primary-foreground/70 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>Cloud-Based</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>Always On Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
