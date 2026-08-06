import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Wrench, Plus, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import {
  useMaintenanceRequests, updateRequestStatus, STATUSES, SEVERITIES, label,
} from "@/hooks/useMaintenance";
import { NewRequestDialog } from "./NewRequestDialog";
import { MaintenanceThread } from "./MaintenanceThread";

const severityTone: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-orange-500/15 text-orange-500",
  emergency: "bg-destructive/15 text-destructive",
};

const statusTone: Record<string, string> = {
  open: "bg-primary/15 text-primary",
  acknowledged: "bg-primary/10 text-primary",
  in_progress: "bg-blue-500/15 text-blue-500",
  on_hold: "bg-orange-500/15 text-orange-500",
  resolved: "bg-emerald-500/15 text-emerald-500",
  cancelled: "bg-muted text-muted-foreground",
};

export function MaintenanceBoard({ scope }: { scope: "landlord" | "tenant" }) {
  const { requests, loading, reload } = useMaintenanceRequests(scope);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          (statusFilter === "all" || r.status === statusFilter) &&
          (severityFilter === "all" || r.severity === severityFilter)
      ),
    [requests, statusFilter, severityFilter]
  );

  const openCount = requests.filter((r) => !["resolved", "cancelled"].includes(r.status)).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Maintenance
            </CardTitle>
            <CardDescription>
              {openCount} active {openCount === 1 ? "request" : "requests"}
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {scope === "tenant" ? "Report Issue" : "Log Issue"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <TableSkeleton rows={3} columns={4} />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No maintenance requests{statusFilter !== "all" || severityFilter !== "all" ? " match these filters" : " yet"}.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const isOpen = expanded === r.id;
              return (
                <div key={r.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold truncate">{r.title}</h4>
                        <Badge className={`text-[10px] border-0 ${severityTone[r.severity] || ""}`}>
                          {label(r.severity)}
                        </Badge>
                        <Badge className={`text-[10px] border-0 ${statusTone[r.status] || ""}`}>
                          {label(r.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {r.property?.name || "Unassigned property"}
                        {r.location_note ? ` · ${r.location_note}` : ""}
                        {` · ${label(r.issue_type)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                    <span className="text-[11px] text-muted-foreground">
                      Reported {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    {scope === "landlord" && !["resolved", "cancelled"].includes(r.status) && (
                      <div className="flex flex-wrap gap-1">
                        {r.status === "open" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => updateRequestStatus(r.id, "acknowledged").then((ok) => ok && reload())}>
                            Acknowledge
                          </Button>
                        )}
                        {r.status !== "in_progress" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => updateRequestStatus(r.id, "in_progress").then((ok) => ok && reload())}>
                            Start work
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => updateRequestStatus(r.id, "on_hold").then((ok) => ok && reload())}>
                          Hold
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => updateRequestStatus(r.id, "resolved").then((ok) => ok && reload())}>
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div className="pt-3 border-t">
                      <MaintenanceThread requestId={r.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <NewRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} scope={scope} onCreated={reload} />
    </Card>
  );
}
