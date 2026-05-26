import { ReactNode, useState } from "react";
import { LandlordSidebar } from "./LandlordSidebar";
import { LandlordBottomNav } from "./LandlordBottomNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface LandlordLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  tierName?: 'free' | 'starter' | 'pro' | 'enterprise' | 'custom';
  title?: string;
  subtitle?: string;
  onUpgradeClick?: () => void;
}

export function LandlordLayout({
  children, activeTab, onTabChange, userName, tierName = "free", title, subtitle, onUpgradeClick
}: LandlordLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    overview: { title: "Dashboard Overview", subtitle: "Welcome back! Here's what's happening" },
    analytics: { title: "Analytics", subtitle: "Insights and business intelligence" },
    properties: { title: "Properties", subtitle: "Manage your rental properties" },
    tenants: { title: "Tenants", subtitle: "Manage your tenants" },
    payments: { title: "Payments", subtitle: "Track rent payments" },
    reports: { title: "Reports & Exports", subtitle: "Download and generate reports" },
    notifications: { title: "Notifications", subtitle: "View your alerts and updates" },
    settings: { title: "Settings", subtitle: "Profile and preferences" },
  };

  const currentTab = tabTitles[activeTab] || { title: title || "Dashboard", subtitle: subtitle || "" };

  return (
    <div className="relative min-h-screen bg-muted">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <LandlordSidebar activeTab={activeTab} onTabChange={onTabChange} userName={userName} tierName={tierName} onUpgradeClick={onUpgradeClick} />
      </div>

      {/* Tablet Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <LandlordSidebar activeTab={activeTab} onTabChange={onTabChange} userName={userName} tierName={tierName} onUpgradeClick={onUpgradeClick} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64 pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="lg:hidden shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">{currentTab.title}</h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{currentTab.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>

      <LandlordBottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
