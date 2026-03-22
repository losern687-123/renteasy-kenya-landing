import { 
  LayoutDashboard, 
  BarChart3,
  Building2,
  Users, 
  CreditCard,
  Menu,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Bell, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LandlordBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainNavItems = [
  { name: "Overview", value: "overview", icon: LayoutDashboard },
  { name: "Analytics", value: "analytics", icon: BarChart3 },
  { name: "Properties", value: "properties", icon: Building2 },
  { name: "Tenants", value: "tenants", icon: Users },
  { name: "Payments", value: "payments", icon: CreditCard },
];

const moreNavItems = [
  { name: "Marketplace", value: "marketplace", icon: Store },
  { name: "Messages", value: "messages", icon: MessageSquare },
  { name: "Reports", value: "reports", icon: FileText },
  { name: "Notifications", value: "notifications", icon: Bell },
  { name: "Settings", value: "settings", icon: Settings },
];

export function LandlordBottomNav({ activeTab, onTabChange }: LandlordBottomNavProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const isMoreActive = moreNavItems.some(item => item.value === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors touch-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive && "text-primary"
                )} />
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </button>
          );
        })}
        
        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors touch-manipulation",
                isMoreActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isMoreActive && "bg-primary/10"
              )}>
                <Menu className={cn(
                  "h-5 w-5",
                  isMoreActive && "text-primary"
                )} />
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onClick={() => onTabChange(item.value)}
                className={cn(
                  "gap-2",
                  activeTab === item.value && "bg-primary/10 text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
