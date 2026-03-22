import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAndCreateLandlordNotifications } from "@/utils/notificationHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Home, DollarSign, Receipt, Copy, CheckCircle, IdCard, Plus, Store } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AddPropertyForm from "@/components/landlord/AddPropertyForm";
import AddTenantForm from "@/components/landlord/AddTenantForm";
import PropertiesTable from "@/components/landlord/PropertiesTable";
import TenantsTable from "@/components/landlord/TenantsTable";
import RecordPaymentForm from "@/components/landlord/RecordPaymentForm";
import LandlordPaymentsView from "@/components/landlord/LandlordPaymentsView";
import CreateListingForm from "@/components/landlord/CreateListingForm";
import ListingsTable from "@/components/landlord/ListingsTable";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { LandlordDashboardSkeleton } from "@/components/ui/skeletons";
import { SubscriptionOverviewCard } from "@/components/subscription/SubscriptionOverviewCard";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { useSubscriptionLimits, useSubscriptionTiers } from "@/hooks/useSubscriptionLimits";
import { LandlordLayout } from "@/components/landlord/LandlordLayout";
import { AnalyticsDashboard } from "@/components/landlord/analytics/AnalyticsDashboard";
import { ReportsTab } from "@/components/landlord/reports/ReportsTab";
import { NotificationsView } from "@/components/notifications/NotificationsView";
import LandlordSettingsTab from "@/components/landlord/LandlordSettingsTab";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  monthlyExpected: number;
  monthlyCollected: number;
}

export default function LandlordDashboard() {
  const { user, userRole, loading } = useAuth();
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
  const [listPropertyId, setListPropertyId] = useState<string | undefined>();
  const [selectedConvo, setSelectedConvo] = useState<any>(null);

  const handleListProperty = (propertyId: string) => {
    setListPropertyId(propertyId);
    setActiveTab("marketplace");
  };

  // Subscription data
  const subscriptionLimits = useSubscriptionLimits();
  const { data: tiers } = useSubscriptionTiers();

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
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <LandlordDashboardSkeleton />
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
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <LandlordDashboardSkeleton />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <PullToRefresh onRefresh={handlePullRefresh} className="space-y-6">
            {/* Welcome & Landlord ID */}
            <FadeIn>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {userName ? `Welcome back, ${userName}` : "Dashboard Overview"}
                  </h2>
                  <p className="text-muted-foreground">
                    Here's what's happening with your properties today.
                  </p>
                </div>
                
                {landlordId && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                        <IdCard className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">Your Landlord ID</p>
                        <p className="text-xl font-bold text-primary tracking-wider">{landlordId}</p>
                        <p className="text-xs text-muted-foreground">Share this with your tenants to connect</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyLandlordId}
                        className="gap-2 border-primary/30 hover:bg-primary/10"
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
                )}
              </div>
            </FadeIn>

            {/* Subscription Card */}
            {!subscriptionLimits.isLoading && (
              <FadeIn delay={0.1}>
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
              </FadeIn>
            )}

            {/* Stats Cards */}
            <StaggerContainer staggerDelay={0.1}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StaggerItem>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2 p-4">
                      <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mb-2 shadow-lg">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm">Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                        {stats.totalProperties}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2 p-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm">Tenants</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-3xl font-bold text-blue-600">{stats.totalTenants}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2 p-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm">Expected</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold text-amber-600">
                        <span className="text-xs">KES</span> {stats.monthlyExpected.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{collectionPercentage}% collected</p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2 p-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
                        <Receipt className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm">Collected</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold text-green-600">
                        <span className="text-xs">KES</span> {stats.monthlyCollected.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </div>
            </StaggerContainer>

            {/* Quick Actions */}
            <FadeIn delay={0.3}>
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setActiveTab("properties")} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Property
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("tenants")} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Tenant
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("payments")} className="gap-2">
                    <DollarSign className="w-4 h-4" /> Record Payment
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("marketplace")} className="gap-2">
                    <Store className="w-4 h-4" /> List Property
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Recent Tables */}
            <FadeIn delay={0.4}>
              <div className="grid lg:grid-cols-2 gap-6">
                <PropertiesTable refresh={refreshKey > 0} onListProperty={handleListProperty} />
                <TenantsTable refresh={refreshKey > 0} />
              </div>
            </FadeIn>
          </PullToRefresh>
        );

      case "analytics":
        return <AnalyticsDashboard onUpgrade={() => setUpgradeModalOpen(true)} />;

      case "properties":
        return (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <AddPropertyForm onSuccess={handleRefresh} />
              <PropertiesTable refresh={refreshKey > 0} onListProperty={handleListProperty} />
            </div>
          </div>
        );

      case "tenants":
        return (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <AddTenantForm onSuccess={handleRefresh} />
              <TenantsTable refresh={refreshKey > 0} />
            </div>
          </div>
        );

      case "payments":
        return (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
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
                      <span className="text-muted-foreground font-medium">Expected</span>
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
                        <span className="font-semibold">Collection Rate</span>
                        <span className="font-bold text-2xl bg-gradient-hero bg-clip-text text-transparent">
                          {collectionPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <LandlordPaymentsView refresh={refreshKey > 0} />
          </div>
        );

      case "reports":
        return <ReportsTab onUpgrade={() => setUpgradeModalOpen(true)} />;

      case "marketplace":
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Marketplace Listings</h2>
              <p className="text-muted-foreground">Create and manage your property listings on the marketplace</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <CreateListingForm
                onSuccess={handleRefresh}
                preselectedPropertyId={listPropertyId}
              />
              <ListingsTable refresh={refreshKey > 0} />
            </div>
          </div>
        );

      case "messages":
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Messages</h2>
              <p className="text-muted-foreground">Chat with property seekers and tenants</p>
            </div>
            <Card className="overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
              <div className="flex h-full">
                <div className="w-full md:w-80 md:border-r border-border overflow-y-auto">
                  <ConversationList
                    selectedId={selectedConvo?.id}
                    onSelect={(c) => setSelectedConvo(c)}
                  />
                </div>
                <div className="hidden md:flex flex-1">
                  {selectedConvo ? (
                    <ChatWindow
                      conversationId={selectedConvo.id}
                      otherUserName={selectedConvo.otherName}
                      listingTitle={selectedConvo.listingTitle}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                      Select a conversation
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        );

      case "notifications":
        return <NotificationsView />;

      case "settings":
        return <LandlordSettingsTab onUpgrade={() => setUpgradeModalOpen(true)} />;

      default:
        return null;
    }
  };

  return (
    <>
      <LandlordLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={userName}
        tierName={subscriptionLimits.tierName as any}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </LandlordLayout>

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
    </>
  );
}
