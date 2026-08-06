import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MaintenanceBoard } from "@/components/maintenance/MaintenanceBoard";

export default function TenantMaintenance() {
  const { user, loading } = useAuth();
  if (loading) return <DashboardLayout><div className="h-40" /></DashboardLayout>;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <DashboardLayout>
      <MaintenanceBoard scope="tenant" />
    </DashboardLayout>
  );
}
