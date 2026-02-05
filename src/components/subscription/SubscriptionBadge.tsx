import { Sparkles, Zap, Building, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TierType = "free" | "pro" | "enterprise" | "custom";
type SizeType = "sm" | "md" | "lg";

interface SubscriptionBadgeProps {
  tier: TierType;
  size?: SizeType;
  className?: string;
}

const tierConfig = {
  free: {
    label: "Free",
    icon: Sparkles,
    className: "bg-muted/50 text-muted-foreground border-muted",
  },
  pro: {
    label: "Pro",
    icon: Zap,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
  },
  enterprise: {
    label: "Enterprise",
    icon: Building,
    className: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
  },
  custom: {
    label: "Custom",
    icon: Crown,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  },
};

const sizeConfig = {
  sm: {
    badge: "text-xs px-2 py-0.5",
    icon: "w-3 h-3",
  },
  md: {
    badge: "text-sm px-2.5 py-1",
    icon: "w-4 h-4",
  },
  lg: {
    badge: "text-base px-3 py-1.5",
    icon: "w-5 h-5",
  },
};

export function SubscriptionBadge({ tier, size = "md", className }: SubscriptionBadgeProps) {
  const config = tierConfig[tier];
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
