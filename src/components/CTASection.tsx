import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
  const benefits = [
    "Free to join",
    "No credit card required",
    "Cancel anytime",
  ];

  return (
    <section className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-mesh opacity-40 animate-gradient-shift" style={{ backgroundSize: "300% 300%" }} />
      
      {/* Floating elements - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-1/4 left-5 md:left-10 w-20 md:w-32 h-20 md:h-32 bg-white/10 rounded-full blur-2xl animate-float" />
      <div className="hidden sm:block absolute bottom-1/4 right-5 md:right-10 w-24 md:w-40 h-24 md:h-40 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 lg:p-20 border border-white/20 shadow-2xl"
        >
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              <span className="text-xs sm:text-sm font-semibold text-white">
                Limited Early Access
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight"
            >
              Get Early Access to
              <span className="block mt-1 sm:mt-2">RentEasy Kenya</span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
            >
              Join thousands of Kenyans already simplifying their rent management. 
              Be among the first to experience stress-free rent tracking.
            </motion.p>

            {/* Benefits list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-1.5 sm:gap-2 text-white/90">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
                  <span className="text-sm sm:text-base">{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-2 sm:pt-4"
            >
              <Button 
                size="lg"
                className="group bg-white text-primary hover:bg-white/95 shadow-2xl hover:shadow-white/20 transition-all duration-500 hover:scale-105 text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-8 rounded-xl sm:rounded-2xl font-semibold w-full sm:w-auto touch-manipulation active:scale-[0.98]"
                asChild
              >
                <a href="/waitlist">
                  <span>Join the Waitlist</span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm pt-4 sm:pt-6"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">500+ early adopters</span>
              </div>
              <div className="hidden sm:block w-1.5 h-1.5 bg-white/50 rounded-full" />
              <span>Join the community</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
