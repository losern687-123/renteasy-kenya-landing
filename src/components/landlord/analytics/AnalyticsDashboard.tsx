import { useState } from "react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { AnalyticsKPICards } from "./AnalyticsKPICards";
import { RevenueChart } from "./RevenueChart";
import { PaymentStatusChart } from "./PaymentStatusChart";
import { PropertyPerformanceChart } from "./PropertyPerformanceChart";
import { LockedFeatureCard } from "./LockedFeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface AnalyticsDashboardProps {
  onUpgrade: () => void;
}

export function AnalyticsDashboard({ onUpgrade }: AnalyticsDashboardProps) {
  const { tierName } = useSubscriptionLimits();
  const [dateRange, setDateRange] = useState("6");
  
  const monthsBack = parseInt(dateRange);
  const analytics = useAnalyticsData(monthsBack);
  
  const canAccessPro = ['pro', 'enterprise', 'custom'].includes(tierName);
  const canAccessEnterprise = ['enterprise', 'custom'].includes(tierName);

  const handleExport = () => {
    // Simple CSV export of recent payments
    const headers = ["Date", "Property", "Tenant", "Amount", "Status"];
    const rows = analytics.recentPayments.map(p => [
      p.payment_date ? format(new Date(p.payment_date), "yyyy-MM-dd") : "",
      p.property_name,
      p.tenant_name || "",
      p.amount,
      p.status,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Insights and business intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {canAccessPro && (
            <>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  {canAccessEnterprise && (
                    <SelectItem value="12">Last 12 months</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <AnalyticsKPICards
        totalRevenue={analytics.totalRevenue}
        revenueChange={analytics.revenueChange}
        collectionRate={analytics.collectionRate}
        outstandingBalance={analytics.outstandingBalance}
        avgDaysToPay={analytics.avgDaysToPay}
        isLoading={analytics.isLoading}
      />

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {canAccessPro ? (
          <>
            <RevenueChart 
              data={analytics.revenueByMonth} 
              isLoading={analytics.isLoading} 
            />
            <PaymentStatusChart 
              data={analytics.paymentStatus} 
              isLoading={analytics.isLoading} 
            />
          </>
        ) : (
          <>
            <LockedFeatureCard
              title="Revenue Trend"
              description="View revenue trends over time with detailed breakdowns by month"
              tierRequired="pro"
              onUpgrade={onUpgrade}
              icon={<TrendingUp className="w-5 h-5 text-muted-foreground" />}
            />
            <LockedFeatureCard
              title="Payment Analysis"
              description="Analyze payment patterns and identify collection opportunities"
              tierRequired="pro"
              onUpgrade={onUpgrade}
              icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />}
            />
          </>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {canAccessPro ? (
          <PropertyPerformanceChart 
            data={analytics.propertyPerformance} 
            isLoading={analytics.isLoading} 
          />
        ) : (
          <LockedFeatureCard
            title="Property Performance"
            description="Compare performance across all your properties"
            tierRequired="pro"
            onUpgrade={onUpgrade}
          />
        )}
        
        {canAccessEnterprise ? (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tenant Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Coming soon - Track tenant retention and churn
              </div>
            </CardContent>
          </Card>
        ) : (
          <LockedFeatureCard
            title="Tenant Retention"
            description="Track tenant churn and retention metrics to improve your business"
            tierRequired="enterprise"
            onUpgrade={onUpgrade}
            icon={<Users className="w-5 h-5 text-muted-foreground" />}
          />
        )}
      </div>

      {/* Recent Payments Table */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Property</th>
                    <th className="text-left py-2 font-medium text-muted-foreground hidden sm:table-cell">Tenant</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentPayments.map((payment, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3">
                        {payment.payment_date 
                          ? format(new Date(payment.payment_date), "MMM dd")
                          : "-"}
                      </td>
                      <td className="py-3">{payment.property_name}</td>
                      <td className="py-3 hidden sm:table-cell">{payment.tenant_name || "-"}</td>
                      <td className="py-3 text-right font-medium">
                        KES {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent payments found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
