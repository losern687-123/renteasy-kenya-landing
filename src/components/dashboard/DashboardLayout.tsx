import { ReactNode } from "react";
import { Home, Plus, History, Settings, LogOut, Bell, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PageTransition, FadeIn } from "@/components/PageTransition";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const tenantName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Tenant";

  const menuItems = [
    { icon: Home, label: "Home", path: "/tenant-dashboard" },
    { icon: Plus, label: "Add Payment", path: "/tenant/add-payment" },
    { icon: History, label: "History", path: "/tenant/history" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/tenant/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-muted flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed h-screen">
        <div className="flex h-[72px] items-center border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">RE</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">RentEasy</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Tenant</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-sm",
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-background border-b border-border px-4 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">RE</span>
            </div>
            <span className="text-base font-bold text-foreground">RentEasy</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full bg-sidebar">
                  <div className="flex h-[72px] items-center border-b border-sidebar-border px-6">
                    <span className="text-base font-bold text-sidebar-foreground">Menu</span>
                  </div>
                  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SheetClose asChild key={item.path}>
                          <Link to={item.path}>
                            <Button
                              variant={isActive(item.path) ? "default" : "ghost"}
                              className={cn(
                                "w-full justify-start gap-3 h-10 text-sm",
                                isActive(item.path)
                                  ? "bg-primary text-primary-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                              )}
                            >
                              <Icon className="h-[18px] w-[18px]" />
                              {item.label}
                            </Button>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  <div className="border-t border-sidebar-border p-3">
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-10 text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={signOut}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              <FadeIn>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Welcome back, {tenantName}!
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Manage your rent payments and track your records
                  </p>
                </div>
              </FadeIn>
              {children}
            </PageTransition>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden bg-background border-t border-border p-2 flex justify-around fixed bottom-0 left-0 right-0 z-50">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col gap-1 h-auto py-2 px-2 w-full min-h-[56px] rounded-lg transition-colors",
                    isActive(item.path) 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive(item.path) && "text-primary")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
};
