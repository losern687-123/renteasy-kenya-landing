import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionLimits, useSubscriptionTiers } from "@/hooks/useSubscriptionLimits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { PricingCard } from "@/components/subscription/PricingCard";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { PageTransition } from "@/components/PageTransition";
import { ArrowLeft, Calendar, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

export default function SubscriptionSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const limits = useSubscriptionLimits();
  const { data: tiers, isLoading: tiersLoading } = useSubscriptionTiers();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const handleUpgradeClick = () => {
    setUpgradeModalOpen(true);
  };

  const propertyPercentage = limits.propertyLimit 
    ? Math.min((limits.propertyCount / limits.propertyLimit) * 100, 100) 
    : 0;
  const tenantPercentage = limits.tenantLimit 
    ? Math.min((limits.tenantCount / limits.tenantLimit) * 100, 100) 
    : 0;

  if (limits.isLoading || tiersLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/landlord-dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Plan & Billing</h1>
                <p className="text-sm text-muted-foreground">Manage your subscription</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Current Plan Card */}
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your active subscription details</CardDescription>
                  </div>
                </div>
                <SubscriptionBadge tier={limits.tierName as any} size="lg" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Usage Stats */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Usage</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Properties</span>
                        <span className="font-medium">
                          {limits.propertyCount} / {limits.propertyLimit ?? "∞"}
                        </span>
                      </div>
                      {limits.propertyLimit && (
                        <Progress value={propertyPercentage} className="h-2" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Tenants</span>
                        <span className="font-medium">
                          {limits.tenantCount} / {limits.tenantLimit ?? "∞"}
                        </span>
                      </div>
                      {limits.tenantLimit && (
                        <Progress value={tenantPercentage} className="h-2" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Plan Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{limits.displayName}</span>
                    </div>
                    {limits.billingCycle && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Billing Cycle</span>
                        <span className="font-medium capitalize">{limits.billingCycle}</span>
                      </div>
                    )}
                    {limits.renewalDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next Renewal</span>
                        <span className="font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(limits.renewalDate, "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {limits.status && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize text-green-600">{limits.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {limits.tierName !== "custom" && limits.tierName !== "enterprise" && (
                <Button onClick={handleUpgradeClick} className="w-full sm:w-auto">
                  Upgrade Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* All Plans */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">All Plans</h2>
                <p className="text-muted-foreground">Compare features and choose the best plan for you</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={billingCycle === "monthly" ? "font-medium" : "text-muted-foreground"}>
                  Monthly
                </span>
                <Switch
                  checked={billingCycle === "annual"}
                  onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
                />
                <span className={billingCycle === "annual" ? "font-medium" : "text-muted-foreground"}>
                  Annual
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">(Save up to 17%)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers?.map((tier) => (
                <PricingCard
                  key={tier.id}
                  tier={tier.name as "free" | "pro" | "enterprise" | "custom"}
                  displayName={tier.display_name}
                  description={tier.description || ""}
                  priceMonthly={tier.price_monthly}
                  priceAnnual={tier.price_annual}
                  maxProperties={tier.max_properties}
                  maxTenants={tier.max_tenants}
                  features={tier.features as string[]}
                  isCurrentTier={tier.name === limits.tierName}
                  billingCycle={billingCycle}
                  onUpgrade={handleUpgradeClick}
                  onContactSales={handleUpgradeClick}
                />
              ))}
            </div>
          </div>
        </main>

        {tiers && (
          <UpgradeModal
            open={upgradeModalOpen}
            onOpenChange={setUpgradeModalOpen}
            tiers={tiers.map(t => ({
              ...t,
              features: t.features as string[],
            }))}
            currentTier={limits.tierName}
          />
        )}
      </div>
    </PageTransition>
  );
}
