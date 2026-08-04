import { ReactNode, useState } from "react";
import { SeekerSidebar } from "./SeekerSidebar";
import { SeekerBottomNav } from "./SeekerBottomNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { EditorialBackdrop } from "@/components/shared/EditorialBackdrop";
import { PageBanner } from "@/components/shared/PageBanner";

interface SeekerLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
}

export function SeekerLayout({ children, activeTab, onTabChange, userName }: SeekerLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <EditorialBackdrop />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SeekerSidebar activeTab={activeTab} onTabChange={onTabChange} userName={userName} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SeekerSidebar 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
            userName={userName} 
            onNavigate={() => setMobileOpen(false)} 
          />
        </SheetContent>
      </Sheet>

      <div className="relative z-10 lg:pl-64">
        {/* Header — same sticky scrim header used across dashboards */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate text-foreground">Property Seeker</h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                Browse listings and find your next home
              </p>
            </div>
          </div>
        </header>


        <main className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
          <PageBanner eyebrow="Property Seeker" title="Find your next home" subtitle="Browse curated listings and link to a property with its code" />
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <SeekerBottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
