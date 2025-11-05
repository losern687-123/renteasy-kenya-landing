import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAndCreateLandlordNotifications } from "@/utils/notificationHelpers";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, DollarSign, LogOut, Building2, UserPlus, Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddPropertyForm from "@/components/landlord/AddPropertyForm";
import AddTenantForm from "@/components/landlord/AddTenantForm";
import PropertiesTable from "@/components/landlord/PropertiesTable";
import TenantsTable from "@/components/landlord/TenantsTable";
import RecordPaymentForm from "@/components/landlord/RecordPaymentForm";
import LandlordPaymentsView from "@/components/landlord/LandlordPaymentsView";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  monthlyExpected: number;
  monthlyCollected: number;
}

export default function LandlordDashboard() {
  const { user, userRole, signOut, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTenants: 0,
    monthlyExpected: 0,
    monthlyCollected: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadUserName();
      checkAndCreateLandlordNotifications(user.id);
    }
  }, [user, refreshKey]);

  const loadUserName = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    if (data?.name) {
      setUserName(data.name);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    // Load properties
    const { data: properties } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", user.id);

    // Load tenants
    const { data: tenants } = await supabase
      .from("tenants")
      .select("*")
      .eq("landlord_id", user.id);

    // Calculate monthly expected from properties
    const monthlyExpected = properties?.reduce((sum, prop) => sum + Number(prop.rent_amount), 0) || 0;

    // Calculate monthly collected from rent_records
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const { data: rentRecords } = await supabase
      .from("rent_records")
      .select("*")
      .eq("status", "paid")
      .gte("payment_date", `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

    const monthlyCollected = rentRecords?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

    setStats({
      totalProperties: properties?.length || 0,
      totalTenants: tenants?.length || 0,
      monthlyExpected,
      monthlyCollected,
    });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === 'tenant') {
    return <Navigate to="/tenant-dashboard" replace />;
  }

  const collectionPercentage = stats.monthlyExpected > 0 
    ? Math.round((stats.monthlyCollected / stats.monthlyExpected) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            RentEasy Kenya
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="outline" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {userName ? `Welcome back, ${userName}` : "Landlord Dashboard"}
          </h2>
          <p className="text-muted-foreground">
            Manage your properties and track rent payments effortlessly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Properties</CardTitle>
              <CardDescription>Total managed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.totalProperties}</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Tenants</CardTitle>
              <CardDescription>Active tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">{stats.totalTenants}</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>This Month</CardTitle>
              <CardDescription>Expected collections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-secondary">KES {stats.monthlyExpected.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-2">{collectionPercentage}% collected</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle>Collected</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">KES {stats.monthlyCollected.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <PropertiesTable refresh={refreshKey > 0} />
              <TenantsTable refresh={refreshKey > 0} />
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <AddPropertyForm onSuccess={handleRefresh} />
              <PropertiesTable refresh={refreshKey > 0} />
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <AddTenantForm onSuccess={handleRefresh} />
              <TenantsTable refresh={refreshKey > 0} />
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <RecordPaymentForm onSuccess={handleRefresh} />
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                  <CardDescription>Track rent collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Expected This Month</span>
                      <span className="font-semibold">KES {stats.monthlyExpected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Collected</span>
                      <span className="font-semibold text-green-600">KES {stats.monthlyCollected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-semibold text-yellow-600">
                        KES {(stats.monthlyExpected - stats.monthlyCollected).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Collection Rate</span>
                        <span className="font-bold text-primary">{collectionPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <LandlordPaymentsView refresh={refreshKey > 0} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
