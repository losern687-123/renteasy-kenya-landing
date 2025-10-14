import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="bg-primary-foreground/10 backdrop-blur-lg rounded-3xl p-12 md:p-16 border border-primary-foreground/20 shadow-2xl">
          <div className="text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-primary-foreground">
                Limited Early Access
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
              Get Early Access to RentEasy Kenya
            </h2>

            {/* Description */}
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of Kenyans already simplifying their rent management. 
              Be among the first to experience stress-free rent tracking.
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <Button 
                size="lg"
                className="bg-background text-primary hover:bg-background/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-lg px-10 py-7 rounded-xl font-semibold"
                asChild
              >
                <a href="/auth">
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 text-primary-foreground/70 text-sm pt-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-accent border-2 border-primary" />
                <div className="w-8 h-8 rounded-full bg-secondary border-2 border-primary" />
                <div className="w-8 h-8 rounded-full bg-accent/80 border-2 border-primary" />
              </div>
              <span className="ml-2">Join 500+ early adopters</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
