import { Link } from "react-router-dom";
import { User, Settings, LogOut, LayoutDashboard, Building2, Shield, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileDropdownProps {
  mobile?: boolean;
}

export const ProfileDropdown = ({ mobile = false }: ProfileDropdownProps) => {
  const { user, signOut, userRole, isApprovedLandlord, landlordStatus } = useAuth();
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

  // Determine dashboard path based on role and approval status
  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "landlord") {
      if (landlordStatus === 'approved') return "/landlord-dashboard";
      if (landlordStatus === 'rejected') return "/landlord/rejected";
      return "/landlord/pending";
    }
    return "/tenant-dashboard";
  };

  const dashboardPath = getDashboardPath();

  // Get status badge for landlords
  const getLandlordStatusBadge = () => {
    if (userRole !== 'landlord') return null;
    
    if (landlordStatus === 'pending') {
      return (
        <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
          Pending
        </Badge>
      );
    }
    if (landlordStatus === 'rejected') {
      return (
        <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/30 text-xs">
          Rejected
        </Badge>
      );
    }
    if (landlordStatus === 'approved') {
      return (
        <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-500/30 text-xs">
          Verified
        </Badge>
      );
    }
    return null;
  };

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
            <div className="flex items-center">
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              {getLandlordStatusBadge()}
            </div>
          </div>
        </div>
        <Link to={dashboardPath}>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        {/* Show Apply as Landlord only for tenants */}
        {userRole === 'tenant' && (
          <Link to="/apply-landlord">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Building2 className="h-4 w-4" />
              Apply as Landlord
            </Button>
          </Link>
        )}
        {/* Show Landlord Dashboard only for approved landlords */}
        {userRole === 'landlord' && isApprovedLandlord && (
          <Link to="/landlord-dashboard">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Building2 className="h-4 w-4" />
              Landlord Dashboard
            </Button>
          </Link>
        )}
        {/* Show pending status for pending landlords */}
        {userRole === 'landlord' && landlordStatus === 'pending' && (
          <Link to="/landlord/pending">
            <Button variant="ghost" className="w-full justify-start gap-2 text-amber-600">
              <Clock className="h-4 w-4" />
              Verification Status
            </Button>
          </Link>
        )}
        {/* Show rejected status for rejected landlords */}
        {userRole === 'landlord' && landlordStatus === 'rejected' && (
          <Link to="/landlord/rejected">
            <Button variant="ghost" className="w-full justify-start gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              Application Status
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
      <DropdownMenuContent align="end" className="w-64 bg-background z-50">
        <div className="flex items-center gap-2 p-3">
          <Avatar className="h-10 w-10 bg-gradient-hero">
            <AvatarFallback className="bg-transparent text-white font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            <p className="text-sm font-medium">{userName || user?.email}</p>
            <div className="flex items-center">
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              {getLandlordStatusBadge()}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={dashboardPath} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        {/* Show Apply as Landlord only for tenants */}
        {userRole === 'tenant' && (
          <DropdownMenuItem asChild>
            <Link to="/apply-landlord" className="cursor-pointer">
              <Building2 className="mr-2 h-4 w-4" />
              Apply as Landlord
            </Link>
          </DropdownMenuItem>
        )}
        {/* Show Landlord Dashboard only for approved landlords */}
        {userRole === 'landlord' && isApprovedLandlord && (
          <DropdownMenuItem asChild>
            <Link to="/landlord-dashboard" className="cursor-pointer">
              <Building2 className="mr-2 h-4 w-4" />
              Landlord Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {/* Show pending status for pending landlords */}
        {userRole === 'landlord' && landlordStatus === 'pending' && (
          <DropdownMenuItem asChild>
            <Link to="/landlord/pending" className="cursor-pointer text-amber-600">
              <Clock className="mr-2 h-4 w-4" />
              Verification Status
            </Link>
          </DropdownMenuItem>
        )}
        {/* Show rejected status for rejected landlords */}
        {userRole === 'landlord' && landlordStatus === 'rejected' && (
          <DropdownMenuItem asChild>
            <Link to="/landlord/rejected" className="cursor-pointer text-destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Application Status
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