import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
  const benefits = [
    "Free to join",
    "No credit card required",
    "Cancel anytime",
  ];

  return (
    <section className="py-16 sm:py-24 md:py-32 px-4 bg-background">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Ready to elevate your management?
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Join 500+ property owners who have revolutionized their income streams with RentEasy Kenya.
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              size="lg"
              className="text-base px-10 py-6 font-semibold w-full sm:w-auto"
              asChild
            >
              <a href="/waitlist">
                Join the Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
