import { Calendar, Bell, MessageSquare, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    title: "Easy landlord–tenant communication",
    description: "Built-in messaging keeps everything documented and accessible. Resolve issues quickly and maintain clear communication.",
  },
  {
    icon: Shield,
    title: "Secure cloud data",
    description: "Your information is encrypted and backed up automatically. Access your data anywhere, anytime, with complete peace of mind.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

const Features = () => {
  return (
    <section className="py-32 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 space-y-6"
        >
          <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground tracking-tight">
            Everything you need to
            <span className="block bg-gradient-hero bg-clip-text text-transparent mt-2">
              manage rent
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Powerful features designed for the Kenyan rental market
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="group relative p-8 bg-card/80 backdrop-blur-md border-2 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 h-full overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                
                <div className="relative space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/20">
                      <feature.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-primary/50 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
                  </div>
                  
                  <h3 className="text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
