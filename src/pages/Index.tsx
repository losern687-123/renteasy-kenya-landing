import { Navbar } from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
};

const Index = () => {
  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />
      <Hero />
      <ScrollReveal>
        <Features />
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <Testimonials />
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <CTASection />
      </ScrollReveal>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </motion.div>
  );
};

export default Index;
