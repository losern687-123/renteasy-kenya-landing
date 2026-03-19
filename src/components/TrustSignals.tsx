import { motion } from "framer-motion";

const partners = ["M-PESA", "EQUITY", "KCB", "NCBA"];

const TrustSignals = () => {
  return (
    <section className="py-12 sm:py-16 px-4 bg-muted">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Built for the complexity of modern Kenyan property management
          </p>
          <div className="flex items-center justify-center gap-10 sm:gap-16 flex-wrap">
            {partners.map((partner) => (
              <span
                key={partner}
                className="text-lg sm:text-xl font-bold text-muted-foreground/40 hover:text-primary transition-colors duration-300 tracking-wider"
              >
                {partner}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSignals;
