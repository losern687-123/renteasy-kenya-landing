import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { cn } from "@/lib/utils";

type TierType = "free" | "pro" | "enterprise" | "custom";

interface PricingCardProps {
  tier: TierType;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  maxProperties: number | null;
  maxTenants: number | null;
  features: string[];
  isCurrentTier?: boolean;
  billingCycle: "monthly" | "annual";
  onUpgrade?: () => void;
  onContactSales?: () => void;
}

export function PricingCard({
  tier,
  displayName,
  description,
  priceMonthly,
  priceAnnual,
  maxProperties,
  maxTenants,
  features,
  isCurrentTier = false,
  billingCycle,
  onUpgrade,
  onContactSales,
}: PricingCardProps) {
  const isCustom = tier === "custom";
  const isPro = tier === "pro";
  const price = billingCycle === "monthly" ? priceMonthly : priceAnnual;
  const monthlyEquivalent = billingCycle === "annual" ? Math.round(priceAnnual / 12) : priceMonthly;
  const annualSavings = billingCycle === "annual" && priceMonthly > 0 
    ? Math.round((1 - (priceAnnual / (priceMonthly * 12))) * 100) 
    : 0;

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full transition-all duration-300",
        isCurrentTier 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-border/50 hover:border-primary/50 hover:shadow-md",
        isPro && !isCurrentTier && "border-blue-500/50"
      )}
    >
      {isPro && (
        <Badge 
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white border-0 px-3"
        >
          Most Popular
        </Badge>
      )}
      
      {isCurrentTier && (
        <Badge 
          className="absolute -top-3 right-4 bg-primary text-primary-foreground border-0"
        >
          Current Plan
        </Badge>
      )}

      <CardHeader className="space-y-3 pt-6">
        <div className="flex items-center gap-2">
          <SubscriptionBadge tier={tier} size="sm" />
        </div>
        <div>
          <CardTitle className="text-xl">{displayName}</CardTitle>
          <CardDescription className="text-sm mt-1">{description}</CardDescription>
        </div>
        
        <div className="pt-2">
          {isCustom ? (
            <div className="text-2xl font-bold text-foreground">Contact Sales</div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">KES</span>
                <span className="text-3xl font-bold text-foreground">
                  {monthlyEquivalent.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {billingCycle === "annual" && priceMonthly > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Billed KES {price.toLocaleString()}/year
                  {annualSavings > 0 && (
                    <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                      (Save {annualSavings}%)
                    </span>
                  )}
                </p>
              )}
              {price === 0 && (
                <p className="text-sm text-muted-foreground mt-1">Free forever</p>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Properties</span>
            <span className="font-medium">
              {maxProperties === null ? "Unlimited" : `Up to ${maxProperties}`}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Tenants</span>
            <span className="font-medium">
              {maxTenants === null ? "Unlimited" : `Up to ${maxTenants}`}
            </span>
          </div>
        </div>

        <ul className="space-y-2.5 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4 mt-auto">
          {isCurrentTier ? (
            <Button disabled className="w-full" variant="outline">
              Current Plan
            </Button>
          ) : isCustom ? (
            <Button 
              onClick={onContactSales} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              Contact Sales
            </Button>
          ) : (
            <Button 
              onClick={onUpgrade} 
              className="w-full"
              variant={isPro ? "default" : "outline"}
            >
              {tier === "free" ? "Get Started" : "Upgrade"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
