import { AdminLayout } from "@/components/admin/AdminLayout";
import { SubscriptionAnalytics } from "@/components/admin/SubscriptionAnalytics";
import { SubscriptionTable } from "@/components/admin/SubscriptionTable";
import { SubscriptionCharts } from "@/components/admin/SubscriptionCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";

function PendingRequests() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-pending-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_requests")
        .select(`
          *,
          landlord:profiles!landlord_id(name, email),
          tier:subscription_tiers!requested_tier_id(name, display_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending upgrade requests
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <Card key={req.id} className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{(req.landlord as any)?.name || "Unknown"}</p>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Pending
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{(req.landlord as any)?.email}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {req.phone_number}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {(req.tier as any)?.display_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(req.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminSubscriptions() {
  return (
    <AdminLayout title="Subscription Management" subtitle="View and manage landlord subscriptions">
      <div className="space-y-6">
        {/* Analytics Cards */}
        <SubscriptionAnalytics />

        {/* Charts */}
        <SubscriptionCharts />

        {/* Tabs for Table and Requests */}
        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscriptions">All Subscriptions</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Landlord Subscriptions</CardTitle>
                <CardDescription>
                  View and manage all active and inactive subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Upgrade Requests</CardTitle>
                <CardDescription>
                  Pending upgrade requests from landlords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingRequests />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
