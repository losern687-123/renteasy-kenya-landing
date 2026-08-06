import { useNavigate } from "react-router-dom";
import { LandlordLayout } from "@/components/landlord/LandlordLayout";
import { MaintenanceBoard } from "@/components/maintenance/MaintenanceBoard";

export default function LandlordMaintenance() {
  const navigate = useNavigate();
  return (
    <LandlordLayout
      activeTab="maintenance"
      onTabChange={() => navigate("/landlord-dashboard")}
      title="Maintenance"
      subtitle="Track and resolve property issues"
    >
      <MaintenanceBoard scope="landlord" />
    </LandlordLayout>
  );
}
