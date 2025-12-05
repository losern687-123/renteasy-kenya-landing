import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RentSummaryCard } from "@/components/dashboard/RentSummaryCard";
import { RentReminderBanner } from "@/components/dashboard/RentReminderBanner";
import { AddPaymentForm } from "@/components/dashboard/AddPaymentForm";
import { PaymentHistoryTable } from "@/components/dashboard/PaymentHistoryTable";
import { EditPaymentDialog } from "@/components/dashboard/EditPaymentDialog";
import { MpesaPaymentModal } from "@/components/dashboard/MpesaPaymentModal";
import { checkAndCreateRentNotifications } from "@/utils/notificationHelpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { motion } from "framer-motion";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { DashboardSkeleton } from "@/components/ui/skeletons";

interface RentRecord {
  id: string;
  property_name: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
}

export default function TenantDashboard() {
  const { user, userRole, loading } = useAuth();
  const [editingRecord, setEditingRecord] = useState<RentRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsInitialLoad(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || isInitialLoad) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === "landlord") {
    return <Navigate to="/landlord-dashboard" replace />;
  }

  const handleEdit = (record: RentRecord) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const checkNotifications = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        await checkAndCreateRentNotifications(user.id, profile.email);
      }
    };

    checkNotifications();
  }, [user]);

  return (
    <DashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-full">
        <div className="space-y-4 sm:space-y-6">
          {/* Welcome Section */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tenant Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your rent payments and view history</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setIsMpesaModalOpen(true)}
                  className="bg-gradient-hero hover:opacity-90 transition-all shadow-lg w-full sm:w-auto h-12 sm:h-11 text-base"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay via M-Pesa
                </Button>
              </motion.div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <RentReminderBanner key={refreshKey} />
          </FadeIn>

          {/* Main Content Grid */}
          <StaggerContainer staggerDelay={0.1}>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <StaggerItem>
                <RentSummaryCard key={refreshKey} />
              </StaggerItem>
              <StaggerItem>
                <AddPaymentForm onSuccess={handleSuccess} />
              </StaggerItem>
            </div>
          </StaggerContainer>

          {/* Payment History */}
          <FadeIn delay={0.3}>
            <div className="mt-4 sm:mt-8">
              <PaymentHistoryTable key={refreshKey} onEdit={handleEdit} />
            </div>
          </FadeIn>

          <EditPaymentDialog
            record={editingRecord}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={handleSuccess}
          />

          <MpesaPaymentModal
            open={isMpesaModalOpen}
            onOpenChange={setIsMpesaModalOpen}
            onSuccess={handleSuccess}
          />
        </div>
      </PullToRefresh>
    </DashboardLayout>
  );
}
