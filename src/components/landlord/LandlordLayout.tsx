import { ReactNode, useState } from "react";
import { LandlordSidebar } from "./LandlordSidebar";
import { LandlordBottomNav } from "./LandlordBottomNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

interface LandlordLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  tierName?: 'free' | 'pro' | 'enterprise' | 'custom';
  title?: string;
  subtitle?: string;
}

export function LandlordLayout({ 
  children, 
  activeTab, 
  onTabChange,
  userName,
  tierName = "free",
  title,
  subtitle
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
    <div className="relative min-h-screen bg-gradient-subtle">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <LandlordSidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange}
          userName={userName}
          tierName={tierName}
        />
      </div>

      {/* Tablet Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <LandlordSidebar 
            activeTab={activeTab} 
            onTabChange={onTabChange}
            userName={userName}
            tierName={tierName}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="lg:pl-64 pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/50 bg-card/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
            {/* Mobile/Tablet Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{currentTab.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                {currentTab.subtitle}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <LandlordBottomNav 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
      />
    </div>
  );
}
