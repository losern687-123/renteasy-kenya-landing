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
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user && isVerified) {
      loadDashboardData();
      loadUserName();
      checkAndCreateLandlordNotifications(user.id);
    }
  }, [user, refreshKey, isVerified]);

  const checkVerificationStatus = async () => {
    if (!user) return;

    // Check if user has landlord role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'landlord') {
      setIsVerified(false);
      return;
    }

    setIsVerified(true);
  };

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

  // Redirect to pending verification page if not verified
  if (isVerified === false) {
    return <Navigate to="/pending-verification" replace />;
  }

  // Show loading state while checking verification
  if (loading || isVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              RentEasy Kenya
            </h1>
            <p className="text-xs text-muted-foreground">Landlord Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button variant="outline" onClick={signOut} className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">
            {userName ? `Welcome back, ${userName}` : "Landlord Dashboard"}
          </h2>
          <p className="text-muted-foreground text-lg">
            Manage your properties and track rent payments effortlessly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="w-14 h-14 bg-gradient-hero rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Home className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-base">Properties</CardTitle>
              <CardDescription className="text-xs">Total managed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">{stats.totalProperties}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-base">Tenants</CardTitle>
              <CardDescription className="text-xs">Active tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalTenants}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-base">Expected</CardTitle>
              <CardDescription className="text-xs">This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">KES {stats.monthlyExpected.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">{collectionPercentage}% collected</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-base">Collected</CardTitle>
              <CardDescription className="text-xs">This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">KES {stats.monthlyCollected.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
                <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Properties</TabsTrigger>
                <TabsTrigger value="tenants" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tenants</TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Payments</TabsTrigger>
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
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Payment Summary
                      </CardTitle>
                      <CardDescription>Track rent collections</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                          <span className="text-muted-foreground font-medium">Expected This Month</span>
                          <span className="font-bold text-lg">KES {stats.monthlyExpected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                          <span className="text-muted-foreground font-medium">Collected</span>
                          <span className="font-bold text-lg text-green-600">KES {stats.monthlyCollected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                          <span className="text-muted-foreground font-medium">Pending</span>
                          <span className="font-bold text-lg text-amber-600">
                            KES {(stats.monthlyExpected - stats.monthlyCollected).toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-4 bg-muted/30 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-base">Collection Rate</span>
                            <span className="font-bold text-2xl bg-gradient-hero bg-clip-text text-transparent">{collectionPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <LandlordPaymentsView refresh={refreshKey > 0} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
