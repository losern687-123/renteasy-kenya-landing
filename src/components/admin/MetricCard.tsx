import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend === "up" && "text-green-600",
                    trend === "down" && "text-red-600",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {change}
                </span>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-xl p-3", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
