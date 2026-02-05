import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { ArrowUpRight, Settings, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type TierType = "free" | "pro" | "enterprise" | "custom";

interface SubscriptionOverviewCardProps {
  tierName: TierType;
  displayName: string;
  propertyCount: number;
  propertyLimit: number | null;
  tenantCount: number;
  tenantLimit: number | null;
  renewalDate?: Date;
  onUpgrade: () => void;
  onViewDetails: () => void;
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 70) return "bg-amber-500";
  return "bg-primary";
}

function UsageBar({ 
  label, 
  current, 
  max 
}: { 
  label: string; 
  current: number; 
  max: number | null; 
}) {
  const isUnlimited = max === null;
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  const colorClass = getProgressColor(percentage);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current} / {isUnlimited ? "∞" : max}
        </span>
      </div>
      {!isUnlimited ? (
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full transition-all", colorClass)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : (
        <div className="h-2 w-full rounded-full bg-primary/20" />
      )}
    </div>
  );
}

export function SubscriptionOverviewCard({
  tierName,
  displayName,
  propertyCount,
  propertyLimit,
  tenantCount,
  tenantLimit,
  renewalDate,
  onUpgrade,
  onViewDetails,
}: SubscriptionOverviewCardProps) {
  const showUpgrade = tierName !== "custom" && tierName !== "enterprise";

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base sm:text-lg">Your Plan</CardTitle>
            <SubscriptionBadge tier={tierName} size="sm" />
          </div>
          {renewalDate && tierName !== "free" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Renews {format(renewalDate, "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <UsageBar 
            label="Properties" 
            current={propertyCount} 
            max={propertyLimit} 
          />
          <UsageBar 
            label="Tenants" 
            current={tenantCount} 
            max={tenantLimit} 
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {showUpgrade && (
            <Button onClick={onUpgrade} className="flex-1 gap-2" size="sm">
              <ArrowUpRight className="w-4 h-4" />
              Upgrade Plan
            </Button>
          )}
          <Button 
            onClick={onViewDetails} 
            variant="outline" 
            className="flex-1 gap-2" 
            size="sm"
          >
            <Settings className="w-4 h-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
