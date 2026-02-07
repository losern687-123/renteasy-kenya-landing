import { Button } from "@/components/ui/button";
import { Upload, FileText, Bell, Edit3, Lock } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BulkOperationsHeaderProps {
  onImportTenants: () => void;
  onImportProperties: () => void;
  onBulkInvoice: () => void;
  onBulkPayment: () => void;
  onBulkNotification: () => void;
  onUpgrade: () => void;
}

export function BulkOperationsHeader({
  onImportTenants,
  onImportProperties,
  onBulkInvoice,
  onBulkPayment,
  onBulkNotification,
  onUpgrade,
}: BulkOperationsHeaderProps) {
  const { tierName } = useSubscriptionLimits();
  const isPro = ['pro', 'enterprise', 'custom'].includes(tierName);
  
  const LockedButton = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 opacity-60" onClick={onUpgrade}>
          <Lock className="w-3 h-3" />
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Upgrade to Pro to unlock {label}</p>
      </TooltipContent>
    </Tooltip>
  );
  
  if (!isPro) {
    return (
      <div className="flex flex-wrap gap-2">
        <LockedButton label="tenant import">
          <Upload className="w-4 h-4" />
          Import Tenants
        </LockedButton>
        <LockedButton label="property import">
          <Upload className="w-4 h-4" />
          Import Properties
        </LockedButton>
        <LockedButton label="bulk invoices">
          <FileText className="w-4 h-4" />
          Generate Invoices
        </LockedButton>
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={onImportTenants}>
        <Upload className="w-4 h-4" />
        Import Tenants
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={onImportProperties}>
        <Upload className="w-4 h-4" />
        Import Properties
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={onBulkInvoice}>
        <FileText className="w-4 h-4" />
        Generate Invoices
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={onBulkPayment}>
        <Edit3 className="w-4 h-4" />
        Record Payments
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={onBulkNotification}>
        <Bell className="w-4 h-4" />
        Send Reminders
      </Button>
    </div>
  );
}
