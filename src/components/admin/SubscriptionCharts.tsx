import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";

const COLORS = ["hsl(var(--muted))", "hsl(215 100% 60%)", "hsl(280 70% 60%)", "hsl(45 90% 50%)"];

export function SubscriptionCharts() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscription-charts"],
    queryFn: async () => {
      // Fetch subscriptions with tiers
      const { data: subscriptions } = await supabase
        .from("landlord_subscriptions")
        .select(`
          *,
          tier:subscription_tiers(name, display_name)
        `);

      // Fetch all landlords to count free users
      const { count: totalLandlords } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "landlord");

      // Calculate tier distribution
      const tierCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0, custom: 0 };
      
      const activeSubs = (subscriptions || []).filter(s => s.status === "active");
      activeSubs.forEach(sub => {
        const tierName = (sub.tier as any)?.name || "free";
        tierCounts[tierName] = (tierCounts[tierName] || 0) + 1;
      });

      // Free users = total landlords - active paid subscribers
      const paidSubs = activeSubs.filter(s => (s.tier as any)?.name !== "free").length;
      tierCounts.free = Math.max(0, (totalLandlords || 0) - paidSubs);

      const distributionData = [
        { name: "Free", value: tierCounts.free, color: COLORS[0] },
        { name: "Pro", value: tierCounts.pro, color: COLORS[1] },
        { name: "Enterprise", value: tierCounts.enterprise, color: COLORS[2] },
        { name: "Custom", value: tierCounts.custom, color: COLORS[3] },
      ].filter(d => d.value > 0);

      // Generate mock trend data for last 6 months (since we don't have historical data)
      const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
      const trendData = months.map((month, i) => ({
        month,
        mrr: Math.floor(5000 + Math.random() * 20000 + i * 3000),
        arr: Math.floor(60000 + Math.random() * 240000 + i * 36000),
      }));

      // Mock upgrade/downgrade data
      const activityData = months.map(month => ({
        month,
        upgrades: Math.floor(Math.random() * 10),
        downgrades: Math.floor(Math.random() * 3),
      }));

      return { distributionData, trendData, activityData };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tier Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            {data?.distributionData && data.distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No subscription data
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="MRR"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade/Downgrade Activity Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.activityData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="upgrades" fill="hsl(142 76% 36%)" name="Upgrades" />
                <Bar dataKey="downgrades" fill="hsl(0 72% 50%)" name="Downgrades" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
