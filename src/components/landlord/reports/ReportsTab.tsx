import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Download, FileText, Users, Building2, Lock, Calendar } from "lucide-react";
import { format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportsTabProps {
  onUpgrade: () => void;
}

export function ReportsTab({ onUpgrade }: ReportsTabProps) {
  const { user } = useAuth();
  const { tierName } = useSubscriptionLimits();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("3");

  const canAccessPro = ['pro', 'enterprise', 'custom'].includes(tierName);

  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/ /g, "_");
        const value = row[key] ?? row[h] ?? "";
        return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPaymentHistory = async () => {
    if (!user) return;
    setIsExporting("payments");

    try {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id")
        .eq("landlord_id", user.id);

      const tenantIds = tenants?.map(t => t.id) || [];

      let query = supabase
        .from("rent_records")
        .select("*")
        .in("tenant_id", tenantIds.length > 0 ? tenantIds : ["none"])
        .order("payment_date", { ascending: false });

      if (canAccessPro) {
        const startDate = format(subMonths(new Date(), parseInt(dateRange)), "yyyy-MM-dd");
        query = query.gte("due_date", startDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const headers = ["Date", "Property", "Tenant", "Amount", "Status", "Method"];
      const formattedData = (data || []).map(r => ({
        date: r.payment_date ? format(new Date(r.payment_date), "yyyy-MM-dd") : "",
        property: r.property_name,
        tenant: r.tenant_name || "",
        amount: r.amount,
        status: r.status,
        method: r.payment_method || "",
      }));

      downloadCSV(formattedData, "payment_history", headers);
      toast.success("Payment history exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export payment history");
    } finally {
      setIsExporting(null);
    }
  };

  const exportTenantList = async () => {
    if (!user) return;
    setIsExporting("tenants");

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("landlord_id", user.id)
        .order("name");

      if (error) throw error;

      const headers = ["Name", "Email", "Phone", "Status", "Verification"];
      const formattedData = (data || []).map(t => ({
        name: t.name,
        email: t.email,
        phone: t.phone,
        status: t.status || "active",
        verification: t.verification_status || "pending",
      }));

      downloadCSV(formattedData, "tenant_list", headers);
      toast.success("Tenant list exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export tenant list");
    } finally {
      setIsExporting(null);
    }
  };

  const exportPropertyList = async () => {
    if (!user) return;
    setIsExporting("properties");

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id)
        .order("name");

      if (error) throw error;

      const headers = ["Name", "Location", "Rent Amount"];
      const formattedData = (data || []).map(p => ({
        name: p.name,
        location: p.location,
        rent_amount: p.rent_amount,
      }));

      downloadCSV(formattedData, "property_list", headers);
      toast.success("Property list exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export property list");
    } finally {
      setIsExporting(null);
    }
  };

  const reports = [
    {
      title: "Payment History",
      description: "Export all payment records",
      icon: FileText,
      onExport: exportPaymentHistory,
      exportKey: "payments",
    },
    {
      title: "Tenant List",
      description: "Export all tenants",
      icon: Users,
      onExport: exportTenantList,
      exportKey: "tenants",
    },
    {
      title: "Property List",
      description: "Export all properties",
      icon: Building2,
      onExport: exportPropertyList,
      exportKey: "properties",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports & Exports</h2>
        <p className="text-muted-foreground">Download and generate reports</p>
      </div>

      {/* Date Range Selector (Pro+) */}
      {canAccessPro && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Report Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Date range:</span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last month</SelectItem>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Reports */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Reports</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.title} className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <report.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-xs">{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={report.onExport}
                  disabled={isExporting === report.exportKey}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  {isExporting === report.exportKey ? "Exporting..." : "Download CSV"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pro Features */}
      {!canAccessPro && (
        <Card className="border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Advanced Reports
            </CardTitle>
            <CardDescription>
              Unlock date range filtering, Excel exports, and custom reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onUpgrade} variant="default" className="gap-2">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
