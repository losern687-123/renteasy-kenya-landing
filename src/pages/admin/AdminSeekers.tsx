import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SeekerProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  inquiry_count: number;
  saved_count: number;
}

const AdminSeekers = () => {
  const { isAuthorized, isLoading: authLoading } = useAdminAuth();
  const [seekers, setSeekers] = useState<SeekerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isAuthorized) {
      fetchSeekers();
    }
  }, [isAuthorized]);

  const fetchSeekers = async () => {
    try {
      // Get all users with property_seeker role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'property_seeker');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setSeekers([]);
        setIsLoading(false);
        return;
      }

      const seekerIds = roleData.map(r => r.user_id);

      // Get profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .in('id', seekerIds);

      if (profileError) throw profileError;

      // Get inquiry counts
      const { data: inquiries } = await supabase
        .from('property_inquiries')
        .select('seeker_id')
        .in('seeker_id', seekerIds);

      // Get saved counts
      const { data: saved } = await supabase
        .from('saved_properties')
        .select('seeker_id')
        .in('seeker_id', seekerIds);

      const seekerProfiles: SeekerProfile[] = (profiles || []).map(p => ({
        ...p,
        inquiry_count: inquiries?.filter(i => i.seeker_id === p.id).length || 0,
        saved_count: saved?.filter(s => s.seeker_id === p.id).length || 0,
      }));

      setSeekers(seekerProfiles);
    } catch (error: any) {
      console.error("Error fetching seekers:", error);
      toast.error("Failed to load seekers");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSeekers = seekers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Property Seekers" subtitle="View and manage property seekers on the platform">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{seekers.length}</p>
                <p className="text-xs text-muted-foreground">Total Seekers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{seekers.reduce((s, sk) => s + sk.inquiry_count, 0)}</p>
                <p className="text-xs text-muted-foreground">Total Inquiries</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {seekers.filter(s => {
                    const created = new Date(s.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">New This Month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Seekers</CardTitle>
              <Input
                placeholder="Search seekers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredSeekers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No property seekers registered yet</div>
            ) : (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Inquiries</TableHead>
                      <TableHead>Saved</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeekers.map((seeker) => (
                      <TableRow key={seeker.id}>
                        <TableCell className="font-medium">{seeker.name}</TableCell>
                        <TableCell className="text-muted-foreground">{seeker.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{seeker.inquiry_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{seeker.saved_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(seeker.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSeekers;
