import { Calendar, Bell, MessageSquare, Shield } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Calendar,
    title: "Rent tracking made simple",
    description: "Keep all your rent payments organized in one place. Track due dates, payment history, and stay on top of your finances effortlessly.",
  },
  {
    icon: Bell,
    title: "Automated reminders",
    description: "Never miss a payment again. Get timely notifications before rent is due, customized to your preferences and schedule.",
  },
  {
    icon: MessageSquare,
    title: "Easy communication",
    description: "Built-in messaging keeps everything documented and accessible. Resolve issues quickly and maintain clear communication.",
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
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const Features = () => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight max-w-xl mx-auto">
            A structural approach to{" "}
            <em className="not-italic text-primary">revenue and relationships</em>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            We've replaced manual spreadsheets with architectural data systems that actually work for the Nairobi market.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <div className="group p-8 bg-card border border-border rounded-xl hover:shadow-md transition-all duration-300 h-full">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
