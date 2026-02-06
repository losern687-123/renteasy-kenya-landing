import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsKPICardsProps {
  totalRevenue: number;
  revenueChange: number;
  collectionRate: number;
  outstandingBalance: number;
  avgDaysToPay: number;
  isLoading?: boolean;
}

export function AnalyticsKPICards({
  totalRevenue,
  revenueChange,
  collectionRate,
  outstandingBalance,
  avgDaysToPay,
  isLoading,
}: AnalyticsKPICardsProps) {
  const cards = [
    {
      title: "This Month Revenue",
      value: `KES ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: revenueChange,
      changeLabel: "vs last month",
      iconBg: "bg-gradient-hero",
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      icon: TrendingUp,
      subtitle: "of expected rent",
      iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
      isGood: collectionRate >= 80,
    },
    {
      title: "Outstanding",
      value: `KES ${outstandingBalance.toLocaleString()}`,
      icon: AlertCircle,
      subtitle: "pending collection",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    },
    {
      title: "Avg Days to Pay",
      value: avgDaysToPay > 0 ? `+${avgDaysToPay} days` : avgDaysToPay < 0 ? `${avgDaysToPay} days` : "On time",
      icon: Clock,
      subtitle: avgDaysToPay > 0 ? "after due date" : avgDaysToPay < 0 ? "before due date" : "average",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2 p-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
          <CardHeader className="pb-2 p-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", card.iconBg)}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{card.value}</p>
            <div className="flex items-center gap-2 mt-1">
              {card.change !== undefined && (
                <span className={cn(
                  "flex items-center text-xs font-medium",
                  card.change >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {card.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {Math.abs(card.change)}%
                </span>
              )}
              {card.subtitle && (
                <span className="text-xs text-muted-foreground">{card.subtitle}</span>
              )}
              {card.changeLabel && card.change !== undefined && (
                <span className="text-xs text-muted-foreground">{card.changeLabel}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
