import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface LandlordApplication {
  id: string;
  user_id: string;
  national_id: string;
  kra_pin: string;
  document_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkAdminAccess();
    fetchApplications();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/admin/login");
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('landlord_applications')
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (applicationId: string, approved: boolean) => {
    setProcessingId(applicationId);
    
    try {
      const { data, error } = await supabase.functions.invoke('approve-landlord', {
        body: {
          applicationId,
          approved,
          rejectionReason: approved ? null : rejectionReason[applicationId]
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        fetchApplications();
        setRejectionReason(prev => {
          const newState = { ...prev };
          delete newState[applicationId];
          return newState;
        });
      } else {
        toast.error(data.error || "Failed to process application");
      }
    } catch (error: any) {
      console.error("Error processing application:", error);
      toast.error(error.message || "Failed to process application");
    } finally {
      setProcessingId(null);
    }
  };

  const ApplicationCard = ({ app }: { app: LandlordApplication }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{app.profiles.name}</CardTitle>
            <CardDescription>{app.profiles.email}</CardDescription>
          </div>
          <Badge variant={
            app.status === 'approved' ? 'default' :
            app.status === 'rejected' ? 'destructive' : 'secondary'
          }>
            {app.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">National ID</p>
            <p className="font-medium">{app.national_id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">KRA PIN</p>
            <p className="font-medium">{app.kra_pin}</p>
          </div>
        </div>
        
        {app.document_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={app.document_url} target="_blank" rel="noopener noreferrer">
              View Document
            </a>
          </Button>
        )}

        {app.status === 'pending' && (
          <div className="space-y-3 pt-2 border-t">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectionReason[app.id] || ''}
              onChange={(e) => setRejectionReason(prev => ({
                ...prev,
                [app.id]: e.target.value
              }))}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleApproval(app.id, true)}
                disabled={processingId === app.id}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleApproval(app.id, false)}
                disabled={processingId === app.id}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {app.status === 'rejected' && app.rejection_reason && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Rejection Reason:</p>
            <p className="text-sm">{app.rejection_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const pendingApps = applications.filter(app => app.status === 'pending');
  const approvedApps = applications.filter(app => app.status === 'approved');
  const rejectedApps = applications.filter(app => app.status === 'rejected');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage landlord applications and user roles</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedApps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedApps.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingApps.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedApps.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : pendingApps.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending applications</p>
            ) : (
              pendingApps.map(app => <ApplicationCard key={app.id} app={app} />)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedApps.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No approved applications</p>
            ) : (
              approvedApps.map(app => <ApplicationCard key={app.id} app={app} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedApps.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No rejected applications</p>
            ) : (
              rejectedApps.map(app => <ApplicationCard key={app.id} app={app} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
