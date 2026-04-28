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
import { ShieldCheck, Link2, CalendarIcon, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "tenant_linked_via_landlord_id", label: "Tenant linked via Landlord ID" },
  { value: "landlord_approved", label: "Landlord approved" },
  { value: "landlord_rejected", label: "Landlord rejected" },
  { value: "rent_recorded", label: "Rent recorded" },
  { value: "rent_confirmed", label: "Rent confirmed" },
  { value: "property_created", label: "Property created" },
  { value: "listing_created", label: "Listing created" },
  { value: "subscription_changed", label: "Subscription changed" },
];

const DEFAULT_ACTIONS = ["tenant_linked_via_landlord_id"];

const AdminAuditLogs = () => {
  const { isAuthorized, isLoading: authLoading } = useAdminAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedActions, setSelectedActions] = useState<string[]>(DEFAULT_ACTIONS);

  useEffect(() => {
    if (isAuthorized) fetchLogs();
  }, [isAuthorized, fromDate, toDate, selectedActions]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("activity_logs")
        .select("id, user_id, action, entity_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (selectedActions.length > 0) {
        query = query.in("action", selectedActions);
      }
      if (fromDate) query = query.gte("created_at", startOfDay(fromDate).toISOString());
      if (toDate) query = query.lte("created_at", endOfDay(toDate).toISOString());

      const { data, error } = await query;
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

  const clearDates = () => {
    setFromDate(undefined);
    setToDate(undefined);
  };

  const toggleAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const selectAllActions = () => setSelectedActions(ACTION_OPTIONS.map((a) => a.value));
  const clearActions = () => setSelectedActions([]);

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

  const DateButton = ({ date, placeholder }: { date?: Date; placeholder: string }) => (
    <Button
      variant="outline"
      className={cn(
        "justify-start text-left font-normal w-[160px]",
        !date && "text-muted-foreground"
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PP") : <span>{placeholder}</span>}
    </Button>
  );

  const actionLabel = (value: string) =>
    ACTION_OPTIONS.find((a) => a.value === value)?.label ?? value.replace(/_/g, " ");

  return (
    <AdminLayout
      title="Audit Logs"
      subtitle="Filter platform events by action type"
    >
      <div className="space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle>Audit Trail</CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start font-normal">
                      <Filter className="mr-2 h-4 w-4" />
                      {selectedActions.length === 0
                        ? "All actions"
                        : selectedActions.length === 1
                        ? actionLabel(selectedActions[0])
                        : `${selectedActions.length} actions`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="end">
                    <div className="p-2 flex items-center justify-between border-b border-border">
                      <span className="text-sm font-medium px-2">Action types</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={selectAllActions}>
                          All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearActions}>
                          None
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                      {ACTION_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedActions.includes(opt.value)}
                            onCheckedChange={() => toggleAction(opt.value)}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <div><DateButton date={fromDate} placeholder="From date" /></div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      disabled={(d) => (toDate ? d > toDate : false) || d > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <div><DateButton date={toDate} placeholder="To date" /></div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      disabled={(d) => (fromDate ? d < fromDate : false) || d > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {(fromDate || toDate) && (
                  <Button variant="ghost" size="sm" onClick={clearDates}>
                    <X className="h-4 w-4 mr-1" /> Clear dates
                  </Button>
                )}
                <Input
                  placeholder="Search by tenant/landlord ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
            {selectedActions.length > 0 && selectedActions.length < ACTION_OPTIONS.length && (
              <div className="flex flex-wrap gap-1 pt-2">
                {selectedActions.map((a) => (
                  <Badge key={a} variant="secondary" className="gap-1">
                    {actionLabel(a)}
                    <button
                      onClick={() => toggleAction(a)}
                      className="ml-1 hover:text-foreground"
                      aria-label={`Remove ${a}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit events found
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User / Tenant ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {actionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.user_id}
                        </TableCell>
                        <TableCell>
                          {log.details?.tenant_name || log.details?.name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.entity_id ? (
                            <Badge variant="outline" className="gap-1">
                              <Link2 className="h-3 w-3" />
                              {log.entity_id}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
