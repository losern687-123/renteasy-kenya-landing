import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface LimitAlertProps {
  type: "properties" | "tenants";
  current: number;
  limit: number;
  tierName: string;
  onUpgrade: () => void;
}

export function LimitAlert({ type, current, limit, tierName, onUpgrade }: LimitAlertProps) {
  const isAtLimit = current >= limit;
  const isNearLimit = current >= limit * 0.8;

  if (!isNearLimit) return null;

  return (
    <Alert 
      variant={isAtLimit ? "destructive" : "default"} 
      className={isAtLimit 
        ? "border-destructive/50 bg-destructive/10" 
        : "border-amber-500/50 bg-amber-500/10"
      }
    >
      <AlertTriangle className={`h-4 w-4 ${isAtLimit ? "text-destructive" : "text-amber-500"}`} />
      <AlertTitle>
        {isAtLimit 
          ? `${type === "properties" ? "Property" : "Tenant"} Limit Reached` 
          : `Approaching ${type === "properties" ? "Property" : "Tenant"} Limit`
        }
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
        <span>
          You've used {current} of {limit} {type} on the {tierName} plan.
          {isAtLimit && ` Upgrade to add more ${type}.`}
        </span>
        <Button 
          size="sm" 
          onClick={onUpgrade}
          className="gap-1 w-fit"
          variant={isAtLimit ? "default" : "outline"}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}
