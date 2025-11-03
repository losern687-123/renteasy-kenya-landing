import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import fluidGraphic from "@/assets/fluid-graphic.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-60 animate-gradient-shift" style={{ backgroundSize: "300% 300%" }} />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-glow" />

      {/* 3D Fluid Graphic */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[50%] h-[80%] opacity-60 pointer-events-none"
        initial={{ opacity: 0, x: 100, rotate: -10 }}
        animate={{ 
          opacity: 0.6, 
          x: 0, 
          rotate: 0,
          y: [0, -20, 0],
        }}
        transition={{ 
          opacity: { duration: 1.2 },
          x: { duration: 1.2 },
          rotate: { duration: 1.2 },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <img 
          src={fluidGraphic} 
          alt="" 
          className="w-full h-full object-contain animate-glow"
        />
      </motion.div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20 mx-auto">
        <div className="max-w-4xl space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Next-Gen Rent Management</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-display font-bold leading-[1.1] tracking-tight"
          >
            <span className="block bg-gradient-hero bg-clip-text text-transparent bg-300% animate-gradient-shift">
              Never forget
            </span>
            <span className="block text-foreground mt-2">
              rent day again
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium leading-relaxed"
          >
            Simplify rent tracking with <span className="text-primary font-semibold">RentEasy Kenya</span>. 
            The modern way to manage payments, reminders, and communication.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Button 
              size="lg" 
              className="group bg-gradient-hero hover:shadow-2xl hover:shadow-primary/50 transition-all duration-500 text-lg px-10 py-7 rounded-2xl font-semibold relative overflow-hidden"
              asChild
            >
              <a href="/auth">
                <span className="relative z-10">Sign Up as Tenant</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="group bg-card/50 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50 hover:bg-card hover:shadow-xl transition-all duration-500 text-lg px-10 py-7 rounded-2xl font-semibold"
              asChild
            >
              <a href="/auth">
                <span>Sign Up as Landlord</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="pt-8 flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground"
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
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
