import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LockedFeatureCardProps {
  title: string;
  description: string;
  tierRequired: 'pro' | 'enterprise';
  onUpgrade: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function LockedFeatureCard({ 
  title, 
  description, 
  tierRequired, 
  onUpgrade, 
  icon,
  className 
}: LockedFeatureCardProps) {
  const tierLabels = {
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <Card className={cn(
      "border-border/50 bg-muted/30 relative overflow-hidden",
      className
    )}>
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-background/40 z-10" />
      
      <CardHeader className="relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              {icon || <Lock className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                <Lock className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </div>
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            tierRequired === "pro" 
              ? "bg-blue-500/10 text-blue-600" 
              : "bg-purple-500/10 text-purple-600"
          )}>
            {tierLabels[tierRequired]}+
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-20">
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button 
          onClick={onUpgrade} 
          variant="outline" 
          className="w-full gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to {tierLabels[tierRequired]}
        </Button>
      </CardContent>
    </Card>
  );
}
