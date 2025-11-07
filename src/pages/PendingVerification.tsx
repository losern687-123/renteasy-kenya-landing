import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PendingVerification = () => {
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkApplicationStatus();
    
    // Set up real-time listener for application updates
    const channel = supabase
      .channel('application-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'landlord_applications'
        },
        (payload) => {
          checkApplicationStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is already a landlord
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role === 'landlord') {
        navigate("/landlord-dashboard");
        return;
      }

      // Check application status
      const { data: application } = await supabase
        .from('landlord_applications')
        .select('status, rejection_reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (application) {
        setApplicationStatus(application.status as 'pending' | 'approved' | 'rejected');
        setRejectionReason(application.rejection_reason);
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          {applicationStatus === 'pending' && (
            <>
              <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">Application Under Review</CardTitle>
                <CardDescription className="text-base">
                  Your landlord application is currently being reviewed by our admin team
                </CardDescription>
              </div>
            </>
          )}
          
          {applicationStatus === 'approved' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">Application Approved!</CardTitle>
                <CardDescription className="text-base">
                  Congratulations! Your landlord application has been approved
                </CardDescription>
              </div>
            </>
          )}
          
          {applicationStatus === 'rejected' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">Application Not Approved</CardTitle>
                <CardDescription className="text-base">
                  Unfortunately, your landlord application was not approved
                </CardDescription>
              </div>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Application Status</span>
              <Badge
                variant={
                  applicationStatus === 'approved' ? 'default' :
                  applicationStatus === 'rejected' ? 'destructive' : 'secondary'
                }
                className="capitalize"
              >
                {applicationStatus}
              </Badge>
            </div>

            {applicationStatus === 'pending' && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Our admin team will review your documents and credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You will receive a notification once your application is processed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>This typically takes 1-2 business days</span>
                  </li>
                </ul>
              </div>
            )}

            {applicationStatus === 'rejected' && rejectionReason && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Reason for Rejection</h4>
                <p className="text-sm text-muted-foreground bg-destructive/10 p-3 rounded border border-destructive/20">
                  {rejectionReason}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can submit a new application after addressing the issues mentioned above.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
            
            {applicationStatus === 'approved' && (
              <Button
                onClick={() => {
                  window.location.href = "/landlord-dashboard";
                }}
              >
                Go to Dashboard
              </Button>
            )}
            
            {applicationStatus === 'rejected' && (
              <Button
                onClick={() => navigate("/apply-landlord")}
              >
                Reapply
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingVerification;
