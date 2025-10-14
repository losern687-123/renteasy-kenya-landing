import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

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

const Testimonials = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Loved by tenants and landlords
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-8 bg-card border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl animate-fade-in-up relative overflow-hidden group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-accent opacity-10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative space-y-6">
                <Quote className="h-10 w-10 text-primary/20" />
                
                <p className="text-foreground/90 text-lg leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                
                <div className="pt-4 border-t border-border">
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
