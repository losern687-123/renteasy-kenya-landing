import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionLimits {
  tierName: string;
  displayName: string;
  propertyLimit: number | null;
  tenantLimit: number | null;
  propertyCount: number;
  tenantCount: number;
  canAddProperty: boolean;
  canAddTenant: boolean;
  features: string[];
  isLoading: boolean;
  renewalDate: Date | null;
  billingCycle: string | null;
  status: string | null;
}

interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  max_properties: number | null;
  max_tenants: number | null;
  features: string[];
  price_monthly: number;
  price_annual: number;
  description: string;
}

const DEFAULT_FREE_TIER: Omit<SubscriptionLimits, "propertyCount" | "tenantCount" | "canAddProperty" | "canAddTenant" | "isLoading"> = {
  tierName: "free",
  displayName: "Free",
  propertyLimit: 5,
  tenantLimit: 10,
  features: ["Basic property management", "Up to 5 properties", "Up to 10 tenants", "Email support"],
  renewalDate: null,
  billingCycle: null,
  status: null,
};

export function useSubscriptionLimits(): SubscriptionLimits {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-limits", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");

      // Fetch subscription and tier info
      const { data: subscription } = await supabase
        .from("landlord_subscriptions")
        .select(`
          *,
          tier:subscription_tiers(*)
        `)
        .eq("landlord_id", user.id)
        .eq("status", "active")
        .single();

      // If no subscription, fetch free tier defaults
      let tier: SubscriptionTier;
      if (!subscription) {
        const { data: freeTier } = await supabase
          .from("subscription_tiers")
          .select("*")
          .eq("name", "free")
          .single();
        
        if (freeTier) {
          tier = {
            ...freeTier,
            features: Array.isArray(freeTier.features) ? freeTier.features as string[] : [],
          };
        } else {
          tier = {
            id: "free",
            name: "free",
            display_name: "Free",
            max_properties: 5,
            max_tenants: 10,
            features: DEFAULT_FREE_TIER.features,
            price_monthly: 0,
            price_annual: 0,
            description: "Perfect for getting started",
          };
        }
      } else {
        const subscriptionTier = subscription.tier as any;
        tier = {
          ...subscriptionTier,
          features: Array.isArray(subscriptionTier.features) ? subscriptionTier.features : [],
        };
      }

      // Count current properties and tenants
      const [propertiesResult, tenantsResult] = await Promise.all([
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("landlord_id", user.id),
        supabase
          .from("tenants")
          .select("id", { count: "exact", head: true })
          .eq("landlord_id", user.id),
      ]);

      const propertyCount = propertiesResult.count || 0;
      const tenantCount = tenantsResult.count || 0;

      const propertyLimit = tier.max_properties;
      const tenantLimit = tier.max_tenants;

      const canAddProperty = propertyLimit === null || propertyCount < propertyLimit;
      const canAddTenant = tenantLimit === null || tenantCount < tenantLimit;

      return {
        tierName: tier.name,
        displayName: tier.display_name,
        propertyLimit,
        tenantLimit,
        propertyCount,
        tenantCount,
        canAddProperty,
        canAddTenant,
        features: Array.isArray(tier.features) ? tier.features : [],
        renewalDate: subscription?.end_date ? new Date(subscription.end_date) : null,
        billingCycle: subscription?.billing_cycle || null,
        status: subscription?.status || null,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  if (isLoading || !data) {
    return {
      ...DEFAULT_FREE_TIER,
      propertyCount: 0,
      tenantCount: 0,
      canAddProperty: true,
      canAddTenant: true,
      isLoading,
    };
  }

  return {
    ...data,
    isLoading,
  };
}

export function useSubscriptionTiers() {
  return useQuery({
    queryKey: ["subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
