import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Authentication required");
        navigate("/admin/login");
        return;
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error || !roleData || roleData.role !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Admin auth check error:", error);
      toast.error("Authorization check failed");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthorized, isLoading };
};
