import { Badge } from "@/components/ui/badge";
import { Home, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VacancyStatusBadgeProps {
  status: string | null;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Home; className: string }> = {
  occupied: {
    label: "Occupied",
    variant: "default",
    icon: Home,
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  vacant: {
    label: "Vacant",
    variant: "destructive",
    icon: AlertCircle,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  unknown: {
    label: "Unknown",
    variant: "outline",
    icon: HelpCircle,
    className: "bg-muted text-muted-foreground",
  },
};

export function VacancyStatusBadge({ status, className }: VacancyStatusBadgeProps) {
  const config = statusConfig[status || "unknown"] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
