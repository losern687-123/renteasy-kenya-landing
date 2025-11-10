import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, CheckCircle, XCircle, Clock, Building2, DollarSign, TrendingUp, FileText } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MetricCard } from "@/components/admin/MetricCard";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

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
  const { isAuthorized, isLoading: authLoading } = useAdminAuth();
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

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
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{app.profiles.name}</CardTitle>
            <CardDescription className="text-sm">{app.profiles.email}</CardDescription>
          </div>
          <Badge 
            variant={
              app.status === 'approved' ? 'default' :
              app.status === 'rejected' ? 'destructive' : 'secondary'
            }
            className="capitalize"
          >
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

  // Mock data for charts
  const weeklyData = [
    { name: 'Mon', applications: 4 },
    { name: 'Tue', applications: 3 },
    { name: 'Wed', applications: 7 },
    { name: 'Thu', applications: 5 },
    { name: 'Fri', applications: 6 },
    { name: 'Sat', applications: 2 },
    { name: 'Sun', applications: 3 },
  ];

  const monthlyPayments = [
    { month: 'Jan', amount: 45000 },
    { month: 'Feb', amount: 52000 },
    { month: 'Mar', amount: 48000 },
    { month: 'Apr', amount: 61000 },
    { month: 'May', amount: 55000 },
    { month: 'Jun', amount: 67000 },
  ];

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
    <AdminLayout title="Dashboard" subtitle="Welcome back, Admin">
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Landlords"
            value={approvedApps.length}
            change="+12%"
            trend="up"
            icon={Building2}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          <MetricCard
            title="Pending Applications"
            value={pendingApps.length}
            icon={Clock}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-600/10"
          />
          <MetricCard
            title="Monthly Revenue"
            value="KES 67,000"
            change="+22%"
            trend="up"
            icon={DollarSign}
            iconColor="text-green-600"
            iconBgColor="bg-green-600/10"
          />
          <MetricCard
            title="Active Tenants"
            value="156"
            change="+8%"
            trend="up"
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-600/10"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Weekly Applications</CardTitle>
              <CardDescription>New landlord applications this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Payment Trends</CardTitle>
              <CardDescription>Total rent payments processed</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyPayments}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Applications Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Landlord Applications</CardTitle>
                <CardDescription>Review and manage landlord applications</CardDescription>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pendingApps.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approved ({approvedApps.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="h-4 w-4" />
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
