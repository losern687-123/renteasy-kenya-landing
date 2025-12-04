import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroBackground from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroBackground} 
          alt="Modern residential property" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-primary/20" />
      </div>
      
      {/* Subtle decorative elements - hidden on small screens for performance */}
      <div className="hidden sm:block absolute top-20 right-10 md:right-20 w-48 md:w-96 h-48 md:h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="hidden sm:block absolute bottom-20 left-10 md:left-20 w-40 md:w-80 h-40 md:h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6 py-16 sm:py-20 mx-auto">
        <div className="max-w-4xl space-y-6 sm:space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Next-Gen Rent Management</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-display font-bold leading-[1.1] tracking-tight"
          >
            <span className="block bg-gradient-hero bg-clip-text text-transparent bg-300% animate-gradient-shift">
              Never forget
            </span>
            <span className="block text-foreground mt-1 sm:mt-2">
              rent day again
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl font-medium leading-relaxed"
          >
            Simplify rent tracking with <span className="text-primary font-semibold">RentEasy Kenya</span>. 
            The modern way to manage payments, reminders, and communication.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4"
          >
            <Button 
              size="lg" 
              className="group bg-gradient-hero hover:shadow-2xl hover:shadow-primary/50 transition-all duration-500 text-base sm:text-lg px-6 sm:px-10 py-6 sm:py-7 rounded-xl sm:rounded-2xl font-semibold relative overflow-hidden w-full sm:w-auto touch-manipulation active:scale-[0.98]"
              asChild
            >
              <a href="/auth">
                <span className="relative z-10">Sign Up as Tenant</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="group bg-card/50 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50 hover:bg-card hover:shadow-xl transition-all duration-500 text-base sm:text-lg px-6 sm:px-10 py-6 sm:py-7 rounded-xl sm:rounded-2xl font-semibold w-full sm:w-auto touch-manipulation active:scale-[0.98]"
              asChild
            >
              <a href="/auth">
                <span>Sign Up as Landlord</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="pt-6 sm:pt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-muted-foreground"
          >
            {["Secure & Encrypted", "Cloud-Based", "Always On Time"].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
