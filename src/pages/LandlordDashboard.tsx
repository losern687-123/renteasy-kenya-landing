import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAndCreateLandlordNotifications } from "@/utils/notificationHelpers";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, DollarSign, LogOut, Receipt, Copy, CheckCircle, IdCard, Menu } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddPropertyForm from "@/components/landlord/AddPropertyForm";
import AddTenantForm from "@/components/landlord/AddTenantForm";
import PropertiesTable from "@/components/landlord/PropertiesTable";
import TenantsTable from "@/components/landlord/TenantsTable";
import RecordPaymentForm from "@/components/landlord/RecordPaymentForm";
import LandlordPaymentsView from "@/components/landlord/LandlordPaymentsView";
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { LandlordDashboardSkeleton } from "@/components/ui/skeletons";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useHaptics } from "@/hooks/useHaptics";
import { SubscriptionOverviewCard } from "@/components/subscription/SubscriptionOverviewCard";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { useSubscriptionLimits, useSubscriptionTiers } from "@/hooks/useSubscriptionLimits";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  monthlyExpected: number;
  monthlyCollected: number;
}

export default function LandlordDashboard() {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTenants: 0,
    monthlyExpected: 0,
    monthlyCollected: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserName] = useState("");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const { impactLight } = useHaptics();

  // Subscription data
  const subscriptionLimits = useSubscriptionLimits();
  const { data: tiers } = useSubscriptionTiers();

  const tabOrder = ["overview", "properties", "tenants", "payments"];

  const navigateTab = useCallback((direction: "next" | "prev") => {
    const currentIndex = tabOrder.indexOf(activeTab);
    let newIndex: number;
    
    if (direction === "next") {
      newIndex = currentIndex < tabOrder.length - 1 ? currentIndex + 1 : currentIndex;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    }
    
    if (newIndex !== currentIndex) {
      setActiveTab(tabOrder[newIndex]);
      impactLight();
    }
  }, [activeTab, impactLight]);

  useSwipeGesture(tabsContainerRef, {
    onSwipeLeft: () => navigateTab("next"),
    onSwipeRight: () => navigateTab("prev"),
    threshold: 50,
  });
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
      .select("name, landlord_id")
      .eq("id", user.id)
      .single();

    if (data?.name) {
      setUserName(data.name);
    }
    if (data?.landlord_id) {
      setLandlordId(data.landlord_id);
    }
  };

  const copyLandlordId = () => {
    if (landlordId) {
      navigator.clipboard.writeText(landlordId);
      setCopiedId(true);
      toast({
        title: "Copied!",
        description: "Landlord ID copied to clipboard. Share it with your tenants.",
      });
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    const { data: properties } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", user.id);

    const { data: tenants } = await supabase
      .from("tenants")
      .select("*")
      .eq("landlord_id", user.id);

    const monthlyExpected = properties?.reduce((sum, prop) => sum + Number(prop.rent_amount), 0) || 0;

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

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handlePullRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshed",
      description: "Dashboard data updated successfully",
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <LandlordDashboardSkeleton />
        </main>
      </div>
    );
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

  if (isVerified === false) {
    return <Navigate to="/pending-verification" replace />;
  }

  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <LandlordDashboardSkeleton />
        </main>
      </div>
    );
  }

  const menuItems = [
    { label: "Overview", value: "overview" },
    { label: "Properties", value: "properties" },
    { label: "Tenants", value: "tenants" },
    { label: "Payments", value: "payments" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent truncate">
                RentEasy Kenya
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Landlord Portal</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <Button 
                variant="outline" 
                onClick={signOut} 
                className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors hidden sm:flex"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden h-10 w-10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-border">
                      <h2 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                        Menu
                      </h2>
                    </div>
                    <div className="flex-1 p-4">
                      <p className="text-sm text-muted-foreground mb-4">Quick Actions</p>
                      {landlordId && (
                        <div className="bg-primary/5 rounded-lg p-4 mb-4">
                          <p className="text-xs text-muted-foreground">Your Landlord ID</p>
                          <p className="text-lg font-bold text-primary">{landlordId}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={copyLandlordId}
                            className="mt-2 w-full"
                          >
                            {copiedId ? "Copied!" : "Copy ID"}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-border">
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={signOut}
                        >
                          <LogOut className="h-5 w-5" />
                          Logout
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <PullToRefresh onRefresh={handlePullRefresh} className="min-h-full">
          <FadeIn>
            <div className="mb-6 sm:mb-8 space-y-4">
              <div className="flex flex-col gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                    {userName ? `Welcome, ${userName}` : "Landlord Dashboard"}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-lg">
                    Manage your properties and track rent payments.
                  </p>
                </div>
                
                {landlordId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-primary/30 bg-primary/5 backdrop-blur-sm">
                      <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                          <IdCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-medium">Your Landlord ID</p>
                          <p className="text-lg sm:text-xl font-bold text-primary tracking-wider truncate">{landlordId}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">Share this with your tenants</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copyLandlordId}
                          className="gap-2 border-primary/30 hover:bg-primary/10 w-full sm:w-auto"
                        >
                          {copiedId ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Subscription Overview Card */}
              {!subscriptionLimits.isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <SubscriptionOverviewCard
                    tierName={subscriptionLimits.tierName as any}
                    displayName={subscriptionLimits.displayName}
                    propertyCount={subscriptionLimits.propertyCount}
                    propertyLimit={subscriptionLimits.propertyLimit}
                    tenantCount={subscriptionLimits.tenantCount}
                    tenantLimit={subscriptionLimits.tenantLimit}
                    renewalDate={subscriptionLimits.renewalDate || undefined}
                    onUpgrade={() => setUpgradeModalOpen(true)}
                    onViewDetails={() => navigate("/landlord/subscription")}
                  />
                </motion.div>
              )}
            </div>
          </FadeIn>

          <StaggerContainer staggerDelay={0.1}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <StaggerItem>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-hero rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg">
                      <Home className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Properties</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Total managed</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">{stats.totalProperties}</p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg">
                      <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Tenants</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Active tenants</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalTenants}</p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg">
                      <DollarSign className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Expected</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">This month</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-amber-600">
                      <span className="text-xs sm:text-sm">KES</span> {stats.monthlyExpected.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{collectionPercentage}% collected</p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg">
                      <Receipt className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Collected</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">This month</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600">
                      <span className="text-xs sm:text-sm">KES</span> {stats.monthlyCollected.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggerContainer>

          <FadeIn delay={0.3}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                  <TabsList className="grid w-full grid-cols-4 h-10 sm:h-12 bg-muted/50 p-1">
                    {menuItems.map((item) => (
                      <TabsTrigger 
                        key={item.value}
                        value={item.value} 
                        className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                      >
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div ref={tabsContainerRef} className="touch-pan-y">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-0">
                          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            <PropertiesTable refresh={refreshKey > 0} />
                            <TenantsTable refresh={refreshKey > 0} />
                          </div>
                        </TabsContent>

                        <TabsContent value="properties" className="space-y-4 sm:space-y-6 mt-0">
                          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            <AddPropertyForm onSuccess={handleRefresh} />
                            <PropertiesTable refresh={refreshKey > 0} />
                          </div>
                        </TabsContent>

                        <TabsContent value="tenants" className="space-y-4 sm:space-y-6 mt-0">
                          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            <AddTenantForm onSuccess={handleRefresh} />
                            <TenantsTable refresh={refreshKey > 0} />
                          </div>
                        </TabsContent>

                        <TabsContent value="payments" className="space-y-4 sm:space-y-6 mt-0">
                          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            <RecordPaymentForm onSuccess={handleRefresh} />
                            <Card className="border-border/50">
                              <CardHeader className="p-3 sm:p-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                  Payment Summary
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Track rent collections</CardDescription>
                              </CardHeader>
                              <CardContent className="p-3 sm:p-6 pt-0">
                                <div className="space-y-3 sm:space-y-4">
                                  <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/50">
                                    <span className="text-muted-foreground font-medium text-xs sm:text-sm">Expected</span>
                                    <span className="font-bold text-sm sm:text-lg">KES {stats.monthlyExpected.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/50">
                                    <span className="text-muted-foreground font-medium text-xs sm:text-sm">Collected</span>
                                    <span className="font-bold text-sm sm:text-lg text-green-600">KES {stats.monthlyCollected.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/50">
                                    <span className="text-muted-foreground font-medium text-xs sm:text-sm">Pending</span>
                                    <span className="font-bold text-sm sm:text-lg text-amber-600">
                                      KES {(stats.monthlyExpected - stats.monthlyCollected).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="pt-3 sm:pt-4 bg-muted/30 rounded-lg p-3 sm:p-4">
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-sm sm:text-base">Collection Rate</span>
                                      <span className="font-bold text-xl sm:text-2xl bg-gradient-hero bg-clip-text text-transparent">{collectionPercentage}%</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          <LandlordPaymentsView refresh={refreshKey > 0} />
                        </TabsContent>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </FadeIn>
          </PullToRefresh>
        </main>

        {/* Upgrade Modal */}
        {tiers && (
          <UpgradeModal
            open={upgradeModalOpen}
            onOpenChange={setUpgradeModalOpen}
            tiers={tiers.map(t => ({
              ...t,
              features: t.features as string[],
            }))}
            currentTier={subscriptionLimits.tierName}
          />
        )}
      </div>
    </PageTransition>
  );
}
