import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRoleRedirect = () => {
  const navigate = useNavigate();

  const redirectBasedOnRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !roleData) {
        console.error("Error fetching role:", roleError);
        return null;
      }

      const role = roleData.role;

      // Handle different roles
      if (role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }

      if (role === 'tenant') {
        navigate('/tenant-dashboard');
        return;
      }

      if (role === 'property_seeker') {
        navigate('/seeker/dashboard');
        return;
      }

      if (role === 'landlord') {
        // Check landlord application status
        const { data: applicationData } = await supabase
          .from('landlord_applications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!applicationData) {
          navigate('/landlord/pending');
          return;
        }

        // Redirect based on application status
        if (applicationData.status === 'approved') {
          navigate('/landlord-dashboard');
        } else if (applicationData.status === 'pending') {
          navigate('/landlord/pending');
        } else if (applicationData.status === 'rejected') {
          navigate('/landlord/rejected');
        } else {
          navigate('/landlord/pending');
        }
      }
    } catch (error) {
      console.error("Error in role redirect:", error);
      toast.error("Failed to determine user role");
    }
  };

  return { redirectBasedOnRole };
};
