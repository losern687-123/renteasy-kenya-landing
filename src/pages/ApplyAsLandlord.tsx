import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ApplyLandlordForm } from "@/components/ApplyLandlordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface Application {
  id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const ApplyAsLandlord = () => {
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndApplication();
  }, []);

  const checkUserAndApplication = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    setUserRole(roleData?.role || 'tenant');

    // If already a landlord, redirect to landlord dashboard
    if (roleData?.role === 'landlord') {
      navigate("/landlord/dashboard");
      return;
    }

    // Check for existing application
    const { data: appData } = await supabase
      .from('landlord_applications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setApplication(appData);
    setIsLoading(false);
  };

  const handleApplicationSuccess = () => {
    checkUserAndApplication();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Become a Landlord</h1>
          <p className="text-muted-foreground">
            Apply to become a verified landlord and start managing your properties
          </p>
        </div>

        {application ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Application Status</CardTitle>
                <Badge variant={
                  application.status === 'approved' ? 'default' :
                  application.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {application.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {application.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {application.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">
                  {new Date(application.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {application.status === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Your application is under review. You'll be notified once it's processed by our admin team.
                  </p>
                </div>
              )}

              {application.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    Congratulations! Your application has been approved. You can now access landlord features.
                  </p>
                </div>
              )}

              {application.status === 'rejected' && (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900">
                      Your application was not approved at this time.
                    </p>
                  </div>
                  {application.rejection_reason && (
                    <div>
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{application.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <ApplyLandlordForm onSuccess={handleApplicationSuccess} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApplyAsLandlord;
