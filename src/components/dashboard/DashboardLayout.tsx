import { ReactNode } from "react";
import { Home, Plus, History, Settings, LogOut, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const tenantName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Tenant";

  const menuItems = [
    { icon: Home, label: "Home", path: "/tenant-dashboard" },
    { icon: Plus, label: "Add Payment", path: "/tenant-dashboard/add-payment" },
    { icon: History, label: "History", path: "/tenant-dashboard/history" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/tenant/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-subtle flex w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-card/80 backdrop-blur-lg border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            RentEasy Kenya
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tenant Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive(item.path) && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex justify-center">
            <NotificationBell />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-card/80 backdrop-blur-lg border-b border-border p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            RentEasy Kenya
          </h1>
          <NotificationBell />
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-foreground">
                Welcome back, {tenantName}!
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage your rent payments and track your records
              </p>
            </div>
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-card/80 backdrop-blur-lg border-t border-border p-2 flex justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col gap-1 h-auto py-2",
                    isActive(item.path) && "text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
};
