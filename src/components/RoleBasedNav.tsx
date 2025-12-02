import { Link } from "react-router-dom";
import { Building2, Home, LayoutDashboard, Users, Shield, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavLink {
  name: string;
  path: string;
  icon?: React.ReactNode;
  roles?: ('tenant' | 'landlord' | 'admin')[];
  requiresApproval?: boolean;
  showForPending?: boolean;
  showForRejected?: boolean;
}

export const RoleBasedNav = ({ mobile }: { mobile?: boolean }) => {
  const { user, userRole, isApprovedLandlord, landlordStatus } = useAuth();

  const navLinks: NavLink[] = [
    { name: "Home", path: "/", icon: <Home className="w-4 h-4" /> },
    { 
      name: "My Dashboard", 
      path: "/tenant-dashboard", 
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['tenant']
    },
    { 
      name: "Apply as Landlord", 
      path: "/apply-landlord", 
      icon: <Building2 className="w-4 h-4" />,
      roles: ['tenant']
    },
    // Only show landlord dashboard for approved landlords
    { 
      name: "Landlord Dashboard", 
      path: "/landlord-dashboard", 
      icon: <Building2 className="w-4 h-4" />,
      roles: ['landlord'],
      requiresApproval: true
    },
    { 
      name: "My Tenants", 
      path: "/landlord-dashboard#tenants", 
      icon: <Users className="w-4 h-4" />,
      roles: ['landlord'],
      requiresApproval: true
    },
    // Show pending status page for pending landlords
    {
      name: "Verification Status",
      path: "/landlord/pending",
      icon: <Clock className="w-4 h-4" />,
      roles: ['landlord'],
      showForPending: true
    },
    // Show rejected status page for rejected landlords
    {
      name: "Application Status",
      path: "/landlord/rejected",
      icon: <XCircle className="w-4 h-4" />,
      roles: ['landlord'],
      showForRejected: true
    },
    { 
      name: "Admin Dashboard", 
      path: "/admin/dashboard", 
      icon: <Shield className="w-4 h-4" />,
      roles: ['admin']
    },
    { 
      name: "Notifications", 
      path: "/notifications",
      roles: ['tenant', 'landlord', 'admin']
    },
  ];

  const filteredLinks = navLinks.filter(link => {
    // Always show links without role requirements
    if (!link.roles) return true;
    
    // Must be logged in with a valid role
    if (!user || !userRole) return false;
    
    // Check if user's role is in the allowed roles
    if (!link.roles.includes(userRole)) return false;
    
    // For landlords, handle approval status visibility
    if (userRole === 'landlord') {
      // If link requires approval, only show for approved landlords
      if (link.requiresApproval) {
        return isApprovedLandlord;
      }
      
      // If link is for pending status, only show for pending landlords
      if (link.showForPending) {
        return landlordStatus === 'pending';
      }
      
      // If link is for rejected status, only show for rejected landlords
      if (link.showForRejected) {
        return landlordStatus === 'rejected';
      }
    }
    
    return true;
  });

  if (mobile) {
    return (
      <div className="flex flex-col gap-2">
        {filteredLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {filteredLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
        >
          {link.icon}
          <span>{link.name}</span>
        </Link>
      ))}
    </div>
  );
};