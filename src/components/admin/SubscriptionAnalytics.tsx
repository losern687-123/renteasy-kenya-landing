import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, UserCheck, Percent, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgClass?: string;
}

function StatCard({ title, value, subtext, icon: Icon, trend, iconBgClass = "bg-primary/10" }: StatCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBgClass)}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtext || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={cn(
                "flex items-center text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {trend.value}%
              </span>
            )}
            {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SubscriptionAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-subscription-analytics"],
    queryFn: async () => {
      // Fetch all landlord subscriptions with tier info
      const { data: subscriptions } = await supabase
        .from("landlord_subscriptions")
        .select(`
          *,
          tier:subscription_tiers(*)
        `)
        .eq("status", "active");

      // Fetch all tiers to get pricing
      const { data: tiers } = await supabase
        .from("subscription_tiers")
        .select("*");

      // Count total landlords
      const { count: totalLandlords } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "landlord");

      // Calculate stats
      const activeSubscriptions = subscriptions || [];
      const paidSubscriptions = activeSubscriptions.filter(s => {
        const tier = s.tier as any;
        return tier?.price_monthly > 0;
      });

      let mrr = 0;
      let arr = 0;

      activeSubscriptions.forEach(sub => {
        const tier = sub.tier as any;
        if (tier) {
          const monthlyAmount = sub.billing_cycle === "annual" 
            ? (tier.price_annual || 0) / 12 
            : (tier.price_monthly || 0);
          mrr += monthlyAmount;
        }
      });

      arr = mrr * 12;

      const paidUsers = paidSubscriptions.length;
      const freeUsers = (totalLandlords || 0) - paidUsers;
      const conversionRate = totalLandlords && totalLandlords > 0 
        ? Math.round((paidUsers / totalLandlords) * 100) 
        : 0;
      const arpu = paidUsers > 0 ? Math.round(mrr / paidUsers) : 0;

      return {
        mrr,
        arr,
        paidUsers,
        freeUsers,
        totalUsers: totalLandlords || 0,
        conversionRate,
        arpu,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Monthly Recurring Revenue"
        value={`KES ${stats?.mrr.toLocaleString() || 0}`}
        icon={DollarSign}
        iconBgClass="bg-green-500/10"
      />
      <StatCard
        title="Annual Recurring Revenue"
        value={`KES ${stats?.arr.toLocaleString() || 0}`}
        icon={DollarSign}
        iconBgClass="bg-emerald-500/10"
      />
      <StatCard
        title="Paid Users"
        value={stats?.paidUsers || 0}
        subtext={`of ${stats?.totalUsers} total`}
        icon={UserCheck}
        iconBgClass="bg-blue-500/10"
      />
      <StatCard
        title="Free Users"
        value={stats?.freeUsers || 0}
        icon={Users}
        iconBgClass="bg-muted"
      />
      <StatCard
        title="Conversion Rate"
        value={`${stats?.conversionRate || 0}%`}
        subtext="free to paid"
        icon={Percent}
        iconBgClass="bg-purple-500/10"
      />
      <StatCard
        title="ARPU"
        value={`KES ${stats?.arpu.toLocaleString() || 0}`}
        subtext="per paid user"
        icon={Calculator}
        iconBgClass="bg-amber-500/10"
      />
    </div>
  );
}
