import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'landlord' | 'tenant')[];
  requireApprovedLandlord?: boolean;
}

export const RouteGuard = ({ children, allowedRoles, requireApprovedLandlord = false }: RouteGuardProps) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to access this page");
        navigate("/auth");
        return;
      }

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !roleData) {
        toast.error("Unable to verify access");
        navigate("/403");
        return;
      }

      const role = roleData.role;

      // Check if user has required role
      if (!allowedRoles.includes(role as any)) {
        toast.error("You don't have permission to access this page");
        navigate("/403");
        return;
      }

      // If landlord role is required, check if they're approved
      if (requireApprovedLandlord && role === 'landlord') {
        const { data: applicationData, error: appError } = await supabase
          .from('landlord_applications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // No application or not approved = redirect to pending/rejected
        if (!applicationData || applicationData.status !== 'approved') {
          toast.error("Your landlord application must be approved first");
          
          if (!applicationData || applicationData.status === 'pending') {
            navigate("/landlord/pending");
          } else if (applicationData.status === 'rejected') {
            navigate("/landlord/rejected");
          } else {
            navigate("/landlord/pending");
          }
          return;
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Error checking access:", error);
      toast.error("Access verification failed");
      navigate("/403");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
