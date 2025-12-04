import { Calendar, Bell, MessageSquare, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    icon: Calendar,
    title: "Rent tracking made simple",
    description: "Keep all your rent payments organized in one place. Track due dates, payment history, and stay on top of your finances effortlessly.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bell,
    title: "Automated reminders",
    description: "Never miss a payment again. Get timely notifications before rent is due, customized to your preferences and schedule.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: MessageSquare,
    title: "Easy landlord–tenant communication",
    description: "Built-in messaging keeps everything documented and accessible. Resolve issues quickly and maintain clear communication.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Secure cloud data",
    description: "Your information is encrypted and backed up automatically. Access your data anywhere, anytime, with complete peace of mind.",
    color: "from-violet-500 to-purple-500",
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
    <section className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
      <div className="hidden sm:block absolute top-1/4 left-0 w-48 md:w-72 h-48 md:h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="hidden sm:block absolute bottom-1/4 right-0 w-64 md:w-96 h-64 md:h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 md:mb-20 space-y-4 sm:space-y-6 px-2"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
            Everything you need to
            <span className="block bg-gradient-hero bg-clip-text text-transparent mt-1 sm:mt-2">
              manage rent
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Powerful features designed for the Kenyan rental market
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="group relative p-5 sm:p-6 md:p-8 bg-card/80 backdrop-blur-md border-2 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 md:hover:-translate-y-2 h-full overflow-hidden touch-manipulation active:scale-[0.99]">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                
                <div className="relative space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="relative">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                      <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                    </div>
                    {/* Glow effect */}
                    <div className={`absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
