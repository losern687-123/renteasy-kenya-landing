import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RentSummaryCard } from "@/components/dashboard/RentSummaryCard";
import { RentReminderBanner } from "@/components/dashboard/RentReminderBanner";
import { AddPaymentForm } from "@/components/dashboard/AddPaymentForm";
import { PaymentHistoryTable } from "@/components/dashboard/PaymentHistoryTable";
import { EditPaymentDialog } from "@/components/dashboard/EditPaymentDialog";

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

  return (
    <DashboardLayout>
      <RentReminderBanner key={refreshKey} />

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
    </DashboardLayout>
  );
}
