import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PricingCard } from "./PricingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";

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

const requestSchema = z.object({
  phone_number: z.string().min(10, "Please enter a valid phone number"),
  company_name: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export function UpgradeModal({ open, onOpenChange, tiers, currentTier }: UpgradeModalProps) {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const handleUpgradeClick = (tier: SubscriptionTier) => {
    if (tier.name === "free") return;
    setSelectedTier(tier);
    setShowRequestForm(true);
  };

  const handleContactSales = () => {
    const customTier = tiers.find(t => t.name === "custom");
    if (customTier) {
      setSelectedTier(customTier);
      setShowRequestForm(true);
    }
  };

  const onSubmit = async (data: RequestFormData) => {
    if (!user || !selectedTier) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("subscription_requests").insert({
        landlord_id: user.id,
        requested_tier_id: selectedTier.id,
        phone_number: data.phone_number,
        billing_cycle: billingCycle,
        company_name: data.company_name || null,
      });

      if (error) throw error;

      setRequestSuccess(true);
      reset();
      
      setTimeout(() => {
        setShowRequestForm(false);
        setSelectedTier(null);
        setRequestSuccess(false);
        onOpenChange(false);
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit upgrade request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setShowRequestForm(false);
    setSelectedTier(null);
    reset();
  };

  const handleClose = () => {
    setShowRequestForm(false);
    setSelectedTier(null);
    setRequestSuccess(false);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {showRequestForm ? `Upgrade to ${selectedTier?.display_name}` : "Choose Your Plan"}
          </DialogTitle>
          <DialogDescription>
            {showRequestForm 
              ? "Fill in your details and our team will contact you within 24 hours"
              : "Select the plan that best fits your needs"}
          </DialogDescription>
        </DialogHeader>

        {!showRequestForm ? (
          <div className="space-y-6 pt-4">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
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

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <PricingCard
                  key={tier.id}
                  tier={tier.name as "free" | "pro" | "enterprise" | "custom"}
                  displayName={tier.display_name}
                  description={tier.description || ""}
                  priceMonthly={tier.price_monthly}
                  priceAnnual={tier.price_annual}
                  maxProperties={tier.max_properties}
                  maxTenants={tier.max_tenants}
                  features={tier.features}
                  isCurrentTier={tier.name === currentTier}
                  billingCycle={billingCycle}
                  onUpgrade={() => handleUpgradeClick(tier)}
                  onContactSales={handleContactSales}
                />
              ))}
            </div>
          </div>
        ) : requestSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">Request Submitted!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Thank you for your interest in upgrading to {selectedTier?.display_name}. 
              Our team will contact you within 24 hours to complete your upgrade.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Selected Plan</p>
              <p className="text-lg font-semibold">{selectedTier?.display_name}</p>
              <p className="text-sm">
                KES {billingCycle === "monthly" 
                  ? selectedTier?.price_monthly.toLocaleString() 
                  : selectedTier?.price_annual.toLocaleString()
                } / {billingCycle === "monthly" ? "month" : "year"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="e.g., 0712345678"
                  {...register("phone_number")}
                />
                {errors.phone_number && (
                  <p className="text-sm text-destructive mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="company_name">Company Name (Optional)</Label>
                <Input
                  id="company_name"
                  placeholder="e.g., ABC Properties Ltd"
                  {...register("company_name")}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
