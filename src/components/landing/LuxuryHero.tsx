import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-estate.jpg";

export const LuxuryHero = () => {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-background border-b border-primary/10">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Luxury estate at twilight"
          width={1920}
          height={1200}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-hero-h)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-hero-v)" }} />
      </div>

      <div className="relative z-10 px-6 md:px-20 max-w-5xl pt-32 md:pt-40 pb-16">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="block text-primary text-[11px] uppercase tracking-[0.4em] mb-6"
        >
          — The Private Collection
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-serif text-5xl sm:text-6xl md:text-8xl leading-[0.95] mb-8 on-veil"
        >
          Elegance in the
          <br />
          <span className="italic font-light text-accent">Heart of Nairobi</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-base md:text-lg font-light on-veil-muted mb-12 max-w-lg leading-relaxed"
        >
          Exclusive property management and a curated rental marketplace for Kenya's
          most prestigious addresses — from Karen's colonial estates to Westlands'
          sky-line penthouses.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center gap-8 md:gap-14"
        >
          <div>
            <div className="text-3xl font-serif font-light on-veil">KES 380,000</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary mt-1">Average monthly yield</div>
          </div>
          <Link
            to="/marketplace"
            className="text-[11px] uppercase tracking-[0.3em] border-b border-primary pb-2 on-veil hover:text-accent hover:border-accent transition-colors"
          >
            Explore Listings →
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
