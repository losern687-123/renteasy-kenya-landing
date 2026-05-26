import { Sparkles, Zap, Building, Crown, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TierType = "free" | "starter" | "pro" | "enterprise" | "custom";
type SizeType = "sm" | "md" | "lg";

interface SubscriptionBadgeProps {
  tier: TierType;
  size?: SizeType;
  className?: string;
}

const tierConfig: Record<TierType, { label: string; icon: any; className: string }> = {
  free: {
    label: "Free",
    icon: Sparkles,
    className: "bg-muted/50 text-muted-foreground border-muted",
  },
  starter: {
    label: "Starter",
    icon: Rocket,
    className: "bg-primary/10 text-primary border-primary/30",
  },
  pro: {
    label: "Professional",
    icon: Zap,
    className: "bg-primary/10 text-primary border-primary/30",
  },
  enterprise: {
    label: "Enterprise",
    icon: Building,
    className: "bg-primary/10 text-primary border-primary/30",
  },
  custom: {
    label: "Custom",
    icon: Crown,
    className: "bg-primary/10 text-primary border-primary/30",
  },
};

const sizeConfig = {
  sm: { badge: "text-xs px-2 py-0.5", icon: "w-3 h-3" },
  md: { badge: "text-sm px-2.5 py-1", icon: "w-4 h-4" },
  lg: { badge: "text-base px-3 py-1.5", icon: "w-5 h-5" },
};

export function SubscriptionBadge({ tier, size = "md", className }: SubscriptionBadgeProps) {
  const config = tierConfig[tier] ?? tierConfig.free;
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.className,
        sizeStyles.badge,
        className
      )}
    >
      <Icon className={sizeStyles.icon} />
      {config.label}
    </Badge>
  );
}
