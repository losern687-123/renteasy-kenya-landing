import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, BarChart3, Building2, Users, 
  CreditCard, FileText, Bell, Settings, LogOut, Store, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";

interface LandlordSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  tierName?: 'free' | 'pro' | 'enterprise' | 'custom';
  onNavigate?: () => void;
}

const navigation = [
  { name: "Overview", value: "overview", icon: LayoutDashboard },
  { name: "Analytics", value: "analytics", icon: BarChart3 },
  { name: "Properties", value: "properties", icon: Building2 },
  { name: "Marketplace", value: "marketplace", icon: Store },
  { name: "Tenants", value: "tenants", icon: Users },
  { name: "Payments", value: "payments", icon: CreditCard },
  { name: "Reports", value: "reports", icon: FileText },
  { name: "Notifications", value: "notifications", icon: Bell },
  { name: "Settings", value: "settings", icon: Settings },
];

export function LandlordSidebar({ 
  activeTab, onTabChange, userName = "Landlord", tierName = "free", onNavigate 
}: LandlordSidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleNavClick = (value: string) => {
    onTabChange(value);
    onNavigate?.();
  };

  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "LN";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-[72px] items-center border-b border-sidebar-border px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">RE</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">RentEasy</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Landlord</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <SubscriptionBadge tier={tierName} size="sm" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {navigation.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.value)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
