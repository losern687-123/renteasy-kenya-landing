import { ReactNode, useState } from "react";
import { SeekerSidebar } from "./SeekerSidebar";
import { SeekerBottomNav } from "./SeekerBottomNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface SeekerLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
}

export function SeekerLayout({ children, activeTab, onTabChange, userName }: SeekerLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-muted">
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

      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate text-foreground">Property Seeker</h1>
            <p className="text-xs text-muted-foreground truncate">Find your next home</p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <header className="sticky top-0 z-30 border-b border-border bg-background px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">Property Seeker Dashboard</h1>
            <p className="text-sm text-muted-foreground">Browse listings and find your next home</p>
          </header>
        </div>

        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <SeekerBottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
