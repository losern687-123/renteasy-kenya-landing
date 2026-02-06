import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  BarChart3,
  Building2,
  Users, 
  CreditCard,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronRight
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
  { name: "Overview", value: "overview", icon: LayoutDashboard, description: "Dashboard home" },
  { name: "Analytics", value: "analytics", icon: BarChart3, description: "Charts & insights" },
  { name: "Properties", value: "properties", icon: Building2, description: "Manage properties" },
  { name: "Tenants", value: "tenants", icon: Users, description: "Tenant management" },
  { name: "Payments", value: "payments", icon: CreditCard, description: "Track payments" },
  { name: "Reports", value: "reports", icon: FileText, description: "Download & export" },
  { name: "Notifications", value: "notifications", icon: Bell, description: "View alerts" },
  { name: "Settings", value: "settings", icon: Settings, description: "Profile & preferences" },
];

export function LandlordSidebar({ 
  activeTab, 
  onTabChange, 
  userName = "Landlord",
  tierName = "free",
  onNavigate 
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

  // Get user initials
  const initials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "LN";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 lg:w-64 bg-card border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-border px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">RE</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">RentEasy</h1>
              <p className="text-xs text-muted-foreground">Landlord Portal</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-white text-sm font-bold shadow-md">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{userName}</p>
              <SubscriptionBadge tier={tierName} size="sm" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </p>
          {navigation.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.value)}
                className={cn(
                  "w-full group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  isActive 
                    ? "bg-white/20" 
                    : "bg-muted group-hover:bg-background"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-primary"
                  )} />
                </div>
                <div className="flex-1 text-left">
                  <span className="block">{item.name}</span>
                  <span className={cn(
                    "block text-xs",
                    isActive ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </span>
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-white/70" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
