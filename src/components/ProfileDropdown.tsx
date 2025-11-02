import { Link } from "react-router-dom";
import { User, Settings, LogOut, LayoutDashboard, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileDropdownProps {
  mobile?: boolean;
}

export const ProfileDropdown = ({ mobile = false }: ProfileDropdownProps) => {
  const { user, signOut, userRole } = useAuth();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadUserName = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (data?.name) {
        setUserName(data.name);
      }
    };

    loadUserName();
  }, [user]);

  const getInitials = () => {
    if (userName) {
      const names = userName.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const dashboardPath = userRole === "admin" 
    ? "/admin/dashboard" 
    : userRole === "landlord" 
    ? "/landlord-dashboard" 
    : "/tenant-dashboard";

  if (mobile) {
    return (
      <div className="flex flex-col gap-2">
        <div className="px-4 py-2 flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-gradient-hero">
            <AvatarFallback className="bg-transparent text-white font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{userName || user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
        <Link to={dashboardPath}>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        {userRole === 'tenant' && (
          <Link to="/apply-landlord">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Building2 className="h-4 w-4" />
              Apply as Landlord
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover-scale">
          <Avatar className="h-10 w-10 bg-gradient-hero">
            <AvatarFallback className="bg-transparent text-white font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-10 w-10 bg-gradient-hero">
            <AvatarFallback className="bg-transparent text-white font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{userName || user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={dashboardPath} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        {userRole === 'tenant' && (
          <DropdownMenuItem asChild>
            <Link to="/apply-landlord" className="cursor-pointer">
              <Building2 className="mr-2 h-4 w-4" />
              Apply as Landlord
            </Link>
          </DropdownMenuItem>
        )}
        {userRole === 'admin' && (
          <DropdownMenuItem asChild>
            <Link to="/admin/dashboard" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/tenant-dashboard/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
