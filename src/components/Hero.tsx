import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative bg-background overflow-hidden">
      <div className="container relative z-10 px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24 mx-auto">
        <div className="max-w-4xl mx-auto lg:mx-0 lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20"
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Property Management 2.0</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.1] tracking-tight"
            >
              <span className="text-primary">Never forget</span>
              <br />
              <span className="text-foreground">rent day again.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed"
            >
              Simplify rent tracking with{" "}
              <span className="text-primary font-semibold">RentEasy Kenya</span>.
              The modern way to manage payments, reminders, and communication.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <Button
                size="lg"
                className="text-base px-8 py-6 font-semibold w-full sm:w-auto"
                asChild
              >
                <a href="/waitlist">
                  Join Waitlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 font-semibold border-primary/20 text-primary hover:bg-primary/5 w-full sm:w-auto"
                asChild
              >
                <a href="/auth">View Demo</a>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
            >
              {["Secure & Encrypted", "Cloud-Based", "Always On Time"].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span>{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual Column - Abstract geometric shapes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              {/* Main card shape */}
              <div className="absolute inset-8 rounded-2xl bg-primary/5 border border-primary/10" />
              {/* Floating card 1 */}
              <div className="absolute top-4 right-4 w-48 h-32 rounded-xl bg-card border border-border shadow-lg p-4">
                <div className="w-8 h-1.5 bg-primary/30 rounded-full mb-3" />
                <div className="w-full h-1 bg-muted rounded-full mb-2" />
                <div className="w-3/4 h-1 bg-muted rounded-full mb-4" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20" />
                  <div className="w-16 h-1 bg-muted rounded-full" />
                </div>
              </div>
              {/* Floating card 2 */}
              <div className="absolute bottom-8 left-0 w-52 h-28 rounded-xl bg-card border border-border shadow-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <div className="w-20 h-1.5 bg-foreground/20 rounded-full" />
                </div>
                <div className="text-2xl font-bold text-foreground">KES 25,000</div>
                <div className="text-xs text-muted-foreground mt-1">Rent payment tracked</div>
              </div>
              {/* Accent circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-primary/10 border border-primary/20" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
