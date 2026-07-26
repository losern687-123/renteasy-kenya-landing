import { motion } from "framer-motion";
import { LuxuryNav } from "@/components/landing/LuxuryNav";
import { LuxuryHero } from "@/components/landing/LuxuryHero";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { FeaturedListings } from "@/components/landing/FeaturedListings";
import { ExperienceSection } from "@/components/landing/ExperienceSection";
import { LuxuryCTA } from "@/components/landing/LuxuryCTA";

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);

const Index = () => {
  return (
    <motion.div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Karla', system-ui, sans-serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <LuxuryNav />
      <LuxuryHero />
      <StatsStrip />
      <ScrollReveal>
        <FeaturedListings />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <ExperienceSection />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <LuxuryCTA />
      </ScrollReveal>
    </motion.div>
  );
};

export default Index;
