import { ReactNode } from "react";
import { Home, Plus, History, Settings, LogOut, Bell, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PageTransition, FadeIn } from "@/components/PageTransition";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-gradient-subtle flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card/80 backdrop-blur-lg border-r border-border flex-col fixed h-screen">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            RentEasy Kenya
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tenant Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-12 text-base",
                      isActive(item.path) && "bg-primary text-primary-foreground shadow-lg"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex justify-center">
            <NotificationBell />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile/Tablet Header */}
        <header className="lg:hidden bg-card/80 backdrop-blur-lg border-b border-border p-4 flex justify-between items-center sticky top-0 z-50">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            RentEasy Kenya
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                      Menu
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Tenant Portal</p>
                  </div>
                  <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SheetClose asChild key={item.path}>
                          <Link to={item.path}>
                            <Button
                              variant={isActive(item.path) ? "default" : "ghost"}
                              className={cn(
                                "w-full justify-start gap-3 h-14 text-base",
                                isActive(item.path) && "bg-primary text-primary-foreground"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              {item.label}
                            </Button>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  <div className="p-4 border-t border-border">
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={signOut}
                      >
                        <LogOut className="h-5 w-5" />
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
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Welcome back, {tenantName}!
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                    Manage your rent payments and track your records
                  </p>
                </div>
              </FadeIn>
              {children}
            </PageTransition>
          </div>
        </div>

        {/* Mobile Bottom Nav - Improved Touch Targets */}
        <nav className="lg:hidden bg-card/95 backdrop-blur-lg border-t border-border p-2 flex justify-around fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col gap-1 h-auto py-2 px-2 w-full min-h-[56px] rounded-xl transition-all",
                    isActive(item.path) 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive(item.path) && "text-primary")} />
                  <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
};
