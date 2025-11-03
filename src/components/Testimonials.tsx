import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Since I joined RentEasy, no more stress at end-month. Everything is tracked automatically!",
    author: "Brian Kamau",
    role: "Tenant, Nairobi",
  },
  {
    quote: "Managing multiple properties has never been easier. The reminders keep everyone on track.",
    author: "Mary Wanjiku",
    role: "Landlord, Mombasa",
  },
  {
    quote: "Communication with my landlord is so much smoother now. Highly recommend this platform!",
    author: "Joseph Omondi",
    role: "Tenant, Kisumu",
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
    <section className="py-32 px-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 space-y-6"
        >
          <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
            <span className="text-foreground">Loved by tenants</span>
            <span className="block bg-gradient-hero bg-clip-text text-transparent mt-2">
              and landlords
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={item}>
              <Card className="group p-8 bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden h-full">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-accent opacity-10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                
                <div className="relative space-y-6">
                  <div className="relative inline-block">
                    <Quote className="h-12 w-12 text-primary/30" />
                    <div className="absolute inset-0 h-12 w-12 text-primary/50 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <Quote className="h-12 w-12" />
                    </div>
                  </div>
                  
                  <p className="text-foreground text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="pt-4 border-t border-border/50">
                    <p className="font-display font-semibold text-foreground">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
