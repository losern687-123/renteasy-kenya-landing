import { useState, useEffect } from "react";
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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

      // Get user email from profile
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
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your rent payments and view history</p>
          </div>
          <Button
            onClick={() => setIsMpesaModalOpen(true)}
            className="bg-gradient-hero hover:opacity-90 transition-all hover:scale-105 shadow-lg"
            size="lg"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Pay via M-Pesa
          </Button>
        </div>

        <RentReminderBanner key={refreshKey} />

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <RentSummaryCard key={refreshKey} />
          </div>
          <div className="space-y-6">
            <AddPaymentForm onSuccess={handleSuccess} />
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-8">
          <PaymentHistoryTable key={refreshKey} onEdit={handleEdit} />
        </div>

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
    </DashboardLayout>
  );
}
