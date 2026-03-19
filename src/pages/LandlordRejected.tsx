import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, Home, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const LandlordRejected = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [applicationDate, setApplicationDate] = useState<string>("");

  useEffect(() => { checkStatus(); }, []);

  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      if (!roleData || roleData.role !== 'landlord') { navigate("/"); return; }
      const { data: application } = await supabase
        .from('landlord_applications').select('status, rejection_reason, created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1).single();

      if (!application) { navigate("/apply-as-landlord"); return; }
      if (application.status === 'approved') { navigate("/landlord-dashboard"); return; }
      if (application.status === 'pending') { navigate("/landlord/pending"); return; }
      setRejectionReason(application.rejection_reason || "No specific reason provided");
      setApplicationDate(new Date(application.created_at).toLocaleDateString());
    } catch (error) { console.error("Error checking status:", error); } finally { setIsLoading(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Application Not Approved</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Your landlord application was not approved at this time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Application Submitted</p>
            <p className="font-semibold text-foreground">{applicationDate}</p>
          </div>

          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertDescription className="text-sm">
              <p className="font-medium mb-1">Reason for rejection:</p>
              <p>{rejectionReason}</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">What you can do:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Review the rejection reason above</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Address any issues mentioned</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Submit a new application when ready</span></li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button onClick={() => navigate("/apply-as-landlord")} className="w-full h-12">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reapply as Landlord
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandlordRejected;
