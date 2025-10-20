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
      <RentReminderBanner key={refreshKey} />

      <div className="mb-6">
        <Button
          onClick={() => setIsMpesaModalOpen(true)}
          className="bg-gradient-hero hover:opacity-90 transition-opacity"
          size="lg"
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Make Rent Payment via M-Pesa
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <RentSummaryCard key={refreshKey} />
        <AddPaymentForm onSuccess={handleSuccess} />
      </div>

      <PaymentHistoryTable key={refreshKey} onEdit={handleEdit} />

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
    </DashboardLayout>
  );
}
