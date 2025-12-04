import { Card } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Since I joined RentEasy, no more stress at end-month. Everything is tracked automatically!",
    author: "Brian Kamau",
    role: "Tenant, Nairobi",
    rating: 5,
    avatar: "BK",
  },
  {
    quote: "Managing multiple properties has never been easier. The reminders keep everyone on track.",
    author: "Mary Wanjiku",
    role: "Landlord, Mombasa",
    rating: 5,
    avatar: "MW",
  },
  {
    quote: "Communication with my landlord is so much smoother now. Highly recommend this platform!",
    author: "Joseph Omondi",
    role: "Tenant, Kisumu",
    rating: 5,
    avatar: "JO",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const Testimonials = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 px-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="hidden sm:block absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="hidden sm:block absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 md:mb-20 space-y-4 sm:space-y-6 px-2"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight">
            <span className="text-foreground">Loved by tenants</span>
            <span className="block bg-gradient-hero bg-clip-text text-transparent mt-1 sm:mt-2">
              and landlords
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={item}>
              <Card className="group p-5 sm:p-6 md:p-8 bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden h-full touch-manipulation active:scale-[0.99]">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-accent opacity-10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                
                <div className="relative space-y-4 sm:space-y-6">
                  {/* Rating stars */}
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <div className="relative inline-block">
                    <Quote className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary/30" />
                  </div>
                  
                  <p className="text-foreground text-base sm:text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="pt-4 border-t border-border/50 flex items-center gap-3 sm:gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground text-sm sm:text-base">
                        {testimonial.author}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile scroll indicator */}
        <div className="md:hidden flex justify-center mt-6 gap-2">
          {testimonials.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-primary/30"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
