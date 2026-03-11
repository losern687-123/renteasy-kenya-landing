import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Activity,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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
    landlord_id: string | null;
  };
}
  document_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  profiles: {
    name: string;
    email: string;
    landlord_id: string | null;
  };
}

interface DashboardMetrics {
  totalTenants: number;
  totalLandlords: number;
  pendingApplications: number;
  totalPayments: number;
  monthlyRevenue: number;
}

const AdminDashboard = () => {
  const { isAuthorized, isLoading: authLoading } = useAdminAuth();
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTenants: 0,
    totalLandlords: 0,
    pendingApplications: 0,
    totalPayments: 0,
    monthlyRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [showRejectionInput, setShowRejectionInput] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchApplications();
      fetchMetrics();

      // Realtime subscription for instant updates
      const channel = supabase
        .channel('admin-dashboard-applications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'landlord_applications' },
          () => {
            fetchApplications();
            fetchMetrics();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
            email,
            landlord_id
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

  const fetchMetrics = async () => {
    try {
      const [tenantsRes, landlordsRes, paymentsRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('landlord_applications').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('rent_records').select('amount').eq('status', 'paid')
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setMetrics({
        totalTenants: tenantsRes.count || 0,
        totalLandlords: landlordsRes.count || 0,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        totalPayments: paymentsRes.data?.length || 0,
        monthlyRevenue: totalRevenue
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
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
        setShowRejectionInput(null);
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

  const pendingApps = applications.filter(app => app.status === 'pending');
  const approvedApps = applications.filter(app => app.status === 'approved');
  const rejectedApps = applications.filter(app => app.status === 'rejected');

  // Chart data
  const weeklyData = [
    { name: 'Mon', applications: 4, payments: 12 },
    { name: 'Tue', applications: 3, payments: 8 },
    { name: 'Wed', applications: 7, payments: 15 },
    { name: 'Thu', applications: 5, payments: 11 },
    { name: 'Fri', applications: 6, payments: 18 },
    { name: 'Sat', applications: 2, payments: 6 },
    { name: 'Sun', applications: 3, payments: 4 },
  ];

  const applicationStatusData = [
    { name: 'Approved', value: approvedApps.length, color: 'hsl(var(--primary))' },
    { name: 'Pending', value: pendingApps.length, color: 'hsl(45 90% 55%)' },
    { name: 'Rejected', value: rejectedApps.length, color: 'hsl(var(--destructive))' },
  ];

  const monthlyTrend = [
    { month: 'Jul', landlords: 12, tenants: 45 },
    { month: 'Aug', landlords: 18, tenants: 62 },
    { month: 'Sep', landlords: 24, tenants: 78 },
    { month: 'Oct', landlords: 31, tenants: 95 },
    { month: 'Nov', landlords: 38, tenants: 112 },
    { month: 'Dec', landlords: 45, tenants: 134 },
  ];

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Dashboard Overview" subtitle="Monitor platform performance and manage applications">
      <div className="space-y-8">
        {/* Quick Stats Row */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Landlords</p>
                  <p className="text-xl sm:text-3xl font-bold text-primary">{approvedApps.length}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">+12%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pending</p>
                  <p className="text-xl sm:text-3xl font-bold text-amber-600">{pendingApps.length}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Needs review
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 hidden sm:block">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Rejected</p>
                  <p className="text-xl sm:text-3xl font-bold text-destructive">{rejectedApps.length}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Total rejections
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hidden sm:block">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Tenants</p>
                  <p className="text-xl sm:text-3xl font-bold text-blue-600">{metrics.totalTenants}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">+8%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 col-span-2 sm:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Revenue</p>
                  <p className="text-lg sm:text-3xl font-bold text-green-600">KES {metrics.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">+22%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Platform Growth
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Monthly landlord and tenant registrations</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="landlordGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="tenantGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(220 70% 50%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(220 70% 50%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="month" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="landlords" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1}
                    fill="url(#landlordGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tenants" 
                    stroke="hsl(220 70% 50%)" 
                    fillOpacity={1}
                    fill="url(#tenantGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Application Status
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Distribution of applications</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={applicationStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {applicationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
                {applicationStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 sm:gap-2">
                    <div 
                      className="h-2 w-2 sm:h-3 sm:w-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Landlord Applications
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage verification requests</CardDescription>
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 w-fit">
                {pendingApps.length} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-auto p-1">
                <TabsTrigger value="pending" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-700">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Pending</span> ({pendingApps.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-700">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Approved</span> ({approvedApps.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
                  <XCircle className="h-4 w-4" />
                  Rejected ({rejectedApps.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : pendingApps.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending applications</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Applicant</TableHead>
                          <TableHead>National ID</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApps.map((app) => (
                          <TableRow key={app.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div>
                                <p className="font-medium">{app.profiles.name}</p>
                                <p className="text-sm text-muted-foreground">{app.profiles.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{app.national_id}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(app.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {app.document_url ? (
                                <a 
                                  href={app.document_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-sm">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {showRejectionInput === app.id ? (
                                <div className="flex flex-col gap-2 items-end">
                                  <Textarea
                                    placeholder="Reason for rejection..."
                                    value={rejectionReason[app.id] || ''}
                                    onChange={(e) => setRejectionReason(prev => ({
                                      ...prev,
                                      [app.id]: e.target.value
                                    }))}
                                    className="w-64 min-h-[60px] text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowRejectionInput(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleApproval(app.id, false)}
                                      disabled={processingId === app.id}
                                    >
                                      Confirm Reject
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproval(app.id, true)}
                                    disabled={processingId === app.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setShowRejectionInput(app.id)}
                                    disabled={processingId === app.id}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved">
                {approvedApps.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No approved applications yet</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Landlord</TableHead>
                          <TableHead>Landlord ID</TableHead>
                          <TableHead>National ID</TableHead>
                          <TableHead>Approved Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedApps.map((app) => (
                          <TableRow key={app.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div>
                                <p className="font-medium">{app.profiles.name}</p>
                                <p className="text-sm text-muted-foreground">{app.profiles.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/30">
                                {app.profiles.landlord_id || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{app.national_id}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(app.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected">
                {rejectedApps.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No rejected applications</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Applicant</TableHead>
                          <TableHead>National ID</TableHead>
                          <TableHead>KRA PIN</TableHead>
                          <TableHead>Rejected Date</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedApps.map((app) => (
                          <TableRow key={app.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div>
                                <p className="font-medium">{app.profiles.name}</p>
                                <p className="text-sm text-muted-foreground">{app.profiles.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{app.national_id}</TableCell>
                            <TableCell className="font-mono text-sm">{app.kra_pin}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(app.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-destructive max-w-xs truncate">
                                {app.rejection_reason || 'No reason provided'}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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