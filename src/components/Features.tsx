import { Calendar, Bell, MessageSquare, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

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

const Features = () => {
  return (
    <section className="py-24 px-4 bg-gradient-subtle">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Everything you need to manage rent
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for the Kenyan rental market
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
