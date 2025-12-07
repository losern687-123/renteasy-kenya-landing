import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Activity, 
  Settings,
  Building2,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, description: "Overview & analytics" },
  { name: "Landlords", href: "/admin/landlords", icon: Building2, description: "Manage applications" },
  { name: "Tenants", href: "/admin/tenants", icon: Users, description: "View all tenants" },
  { name: "Payments", href: "/admin/payments", icon: DollarSign, description: "Transaction history" },
  { name: "Activity Logs", href: "/admin/activity", icon: Activity, description: "System events" },
  { name: "Settings", href: "/admin/settings", icon: Settings, description: "Configuration" },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 lg:w-64 bg-[hsl(155_25%_10%)] border-r border-[hsl(155_15%_18%)]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-[hsl(155_15%_18%)] px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">RE</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">RentEasy</h1>
              <p className="text-xs text-[hsl(155_20%_60%)]">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-semibold text-[hsl(155_20%_45%)] uppercase tracking-wider">
            Main Menu
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-[hsl(155_15%_70%)] hover:bg-[hsl(155_20%_15%)] hover:text-white"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  isActive 
                    ? "bg-white/20" 
                    : "bg-[hsl(155_20%_15%)] group-hover:bg-[hsl(155_20%_20%)]"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-[hsl(155_40%_50%)]"
                  )} />
                </div>
                <div className="flex-1">
                  <span className="block">{item.name}</span>
                  <span className={cn(
                    "block text-xs",
                    isActive ? "text-white/70" : "text-[hsl(155_15%_50%)]"
                  )}>
                    {item.description}
                  </span>
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-white/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[hsl(155_15%_18%)] p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-[hsl(155_20%_12%)] px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-white text-sm font-bold shadow-md">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-[hsl(155_15%_50%)] truncate">System Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-[hsl(155_15%_60%)] hover:text-white hover:bg-[hsl(155_20%_15%)]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}