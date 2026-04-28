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
import { ShieldCheck, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AuditLog {
  id: string;
  user_id: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const AdminAuditLogs = () => {
  const { isAuthorized, isLoading: authLoading } = useAdminAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isAuthorized) fetchLogs();
  }, [isAuthorized]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, user_id, entity_id, details, created_at")
        .eq("action", "tenant_linked_via_landlord_id")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      l.user_id.toLowerCase().includes(q) ||
      (l.entity_id || "").toLowerCase().includes(q) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(q)
    );
  });

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
    <AdminLayout
      title="Audit Logs"
      subtitle="Tenant–Landlord links created via Landlord ID"
    >
      <div className="space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle>Tenant Link Audit Trail</CardTitle>
              </div>
              <Input
                placeholder="Search by tenant/landlord ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tenant-link events found
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant ID</TableHead>
                      <TableHead>Tenant Name</TableHead>
                      <TableHead>Landlord ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {log.user_id}
                        </TableCell>
                        <TableCell>
                          {log.details?.tenant_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <Badge variant="outline" className="gap-1">
                            <Link2 className="h-3 w-3" />
                            {log.entity_id}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
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

export default AdminAuditLogs;
