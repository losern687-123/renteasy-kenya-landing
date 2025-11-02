import { Link } from "react-router-dom";
import { Building2, Home, LayoutDashboard, Users, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavLink {
  name: string;
  path: string;
  icon?: React.ReactNode;
  roles?: ('tenant' | 'landlord' | 'admin')[];
}

export const RoleBasedNav = ({ mobile }: { mobile?: boolean }) => {
  const { user, userRole } = useAuth();

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
    { 
      name: "Landlord Dashboard", 
      path: "/landlord-dashboard", 
      icon: <Building2 className="w-4 h-4" />,
      roles: ['landlord']
    },
    { 
      name: "My Tenants", 
      path: "/landlord-dashboard#tenants", 
      icon: <Users className="w-4 h-4" />,
      roles: ['landlord']
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
    if (!link.roles) return true;
    if (!user || !userRole) return false;
    return link.roles.includes(userRole);
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
