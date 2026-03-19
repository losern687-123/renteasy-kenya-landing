import { Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Since I joined RentEasy, no more stress at end-month. Everything is tracked automatically!",
    author: "Brian Kamau",
    role: "TENANT",
    location: "WESTLANDS",
    rating: 5,
    initials: "BK",
  },
  {
    quote: "Managing multiple properties has never been easier. The reminders keep everyone on track.",
    author: "Mary Wanjiku",
    role: "LANDLORD",
    location: "KAREN",
    rating: 5,
    initials: "MW",
  },
  {
    quote: "Communication with my landlord is so much smoother now. Highly recommend this platform!",
    author: "Joseph Omondi",
    role: "TENANT",
    location: "KILIMANI",
    rating: 5,
    initials: "JO",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Testimonials = () => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-muted">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Voices of the Skyline
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={item}>
              <div className="p-8 bg-card border border-border rounded-xl h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-0.5 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground text-base leading-relaxed flex-1 mb-6">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {testimonial.author}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-primary uppercase">
                        {testimonial.role}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {testimonial.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
