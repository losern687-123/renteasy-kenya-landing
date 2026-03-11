import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Eye, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LandlordApplication {
  id: string;
  user_id: string;
  national_id: string;
  document_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminLandlords = () => {
  const { isAuthorized, isLoading: authLoading } = useAdminAuth();
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedApp, setSelectedApp] = useState<LandlordApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchApplications();
    }
  }, [isAuthorized]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('landlord_applications')
        .select(`
          *,
          profiles:profiles!fk_landlord_applications_profiles (
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
          rejectionReason: approved ? null : rejectionReason
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        fetchApplications();
        setShowRejectDialog(false);
        setRejectionReason("");
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

  const openRejectDialog = (app: LandlordApplication) => {
    setSelectedApp(app);
    setShowRejectDialog(true);
  };

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Landlords" subtitle="Manage landlord applications and verifications">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved Landlords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>All Landlord Applications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No applications found</div>
            ) : (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>KRA PIN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.profiles.name}</TableCell>
                        <TableCell>{app.profiles.email}</TableCell>
                        <TableCell>{app.national_id}</TableCell>
                        <TableCell>{app.kra_pin}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              app.status === 'approved' ? 'default' :
                              app.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                            className="capitalize"
                          >
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {app.document_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a href={app.document_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {app.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproval(app.id, true)}
                                  disabled={processingId === app.id}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectDialog(app)}
                                  disabled={processingId === app.id}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this application. The applicant will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedApp && handleApproval(selectedApp.id, false)}
                  disabled={!rejectionReason.trim() || processingId === selectedApp?.id}
                >
                  Reject Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminLandlords;
