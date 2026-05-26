import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PricingCard } from "./PricingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  max_properties: number | null;
  max_tenants: number | null;
  features: string[];
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiers: SubscriptionTier[];
  currentTier: string;
}

// Ordered tier progression for "Recommended" badge logic
const TIER_ORDER = ["free", "starter", "pro", "enterprise"];

export function UpgradeModal({ open, onOpenChange, tiers, currentTier }: UpgradeModalProps) {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Show only the 4-tier upgrade grid (hide custom)
  const visibleTiers = useMemo(
    () =>
      [...tiers]
        .filter((t) => t.name !== "custom")
        .sort((a, b) => TIER_ORDER.indexOf(a.name) - TIER_ORDER.indexOf(b.name)),
    [tiers]
  );

  const recommendedTierName = useMemo(() => {
    const idx = TIER_ORDER.indexOf(currentTier);
    if (idx < 0) return "starter";
    return TIER_ORDER[idx + 1] ?? null;
  }, [currentTier]);

  const handleUpgradeClick = async (tier: SubscriptionTier) => {
    if (!user) {
      toast.error("You must be signed in to upgrade.");
      return;
    }
    if (tier.name === "free" || tier.name === currentTier) return;

    const price = billingCycle === "monthly" ? tier.price_monthly : tier.price_annual;
    if (!price || price <= 0) {
      toast.error("Invalid pricing for this tier. Please contact support.");
      return;
    }

    setLoadingTier(tier.name);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initiate", {
        body: {
          payment_type: "subscription",
          amount: Math.round(price),
          email: user.email,
          metadata: {
            landlord_id: user.id,
            tier: tier.name,
            billing_cycle: billingCycle,
          },
        },
      });

      if (error) throw new Error(error.message || "Failed to start payment");
      if (!data?.authorization_url) {
        throw new Error(data?.error || "Could not initiate payment. Please try again.");
      }

      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast.error(err?.message || "Failed to start payment");
      setLoadingTier(null);
    }
  };

  const handleContactSales = () => {
    toast.info("Please reach out to support for custom enterprise pricing.");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !loadingTier && onOpenChange(o)}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Pay securely via Paystack. Your new features activate as soon as the
            payment is confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={billingCycle === "monthly" ? "font-medium" : "text-muted-foreground"}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === "annual"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
              disabled={loadingTier !== null}
            />
            <span className={billingCycle === "annual" ? "font-medium" : "text-muted-foreground"}>
              Annual
              <span className="ml-1 text-xs text-primary">(Save up to 17%)</span>
            </span>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleTiers.map((tier) => (
              <PricingCard
                key={tier.id}
                tier={tier.name as any}
                displayName={tier.display_name}
                description={tier.description || ""}
                priceMonthly={tier.price_monthly}
                priceAnnual={tier.price_annual}
                maxProperties={tier.max_properties}
                maxTenants={tier.max_tenants}
                features={tier.features}
                isCurrentTier={tier.name === currentTier}
                isRecommended={tier.name === recommendedTierName}
                isLoading={loadingTier === tier.name}
                disabled={loadingTier !== null && loadingTier !== tier.name}
                billingCycle={billingCycle}
                onUpgrade={() => handleUpgradeClick(tier)}
                onContactSales={handleContactSales}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
