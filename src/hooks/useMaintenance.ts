import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const ISSUE_TYPES = [
  "plumbing",
  "electrical",
  "structural",
  "appliance",
  "pest",
  "security",
  "cleaning",
  "other",
] as const;

export const SEVERITIES = ["low", "medium", "high", "emergency"] as const;

export const STATUSES = [
  "open",
  "acknowledged",
  "in_progress",
  "on_hold",
  "resolved",
  "cancelled",
] as const;

export type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  severity: string;
  status: string;
  property_id: string | null;
  tenant_id: string | null;
  landlord_id: string;
  created_by: string;
  location_note: string | null;
  assigned_to: string | null;
  target_date: string | null;
  actual_cost: number | null;
  quoted_cost: number | null;
  created_at: string;
  updated_at: string;
  property?: { name: string; location: string } | null;
};

export const label = (v: string) =>
  v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export function useMaintenanceRequests(scope: "landlord" | "tenant") {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("maintenance_requests")
      .select("*, property:properties(name, location)")
      .order("created_at", { ascending: false });

    query =
      scope === "landlord"
        ? query.eq("landlord_id", user.id)
        : query.eq("tenant_id", user.id);

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load maintenance requests");
      setLoading(false);
      return;
    }
    setRequests((data || []) as unknown as MaintenanceRequest[]);
    setLoading(false);
  }, [user, scope]);

  useEffect(() => {
    load();
  }, [load]);

  return { requests, loading, reload: load };
}

export async function updateRequestStatus(id: string, status: string) {
  const patch: Record<string, unknown> = { status };
  if (status === "in_progress") patch.started_at = new Date().toISOString();
  if (status === "resolved") patch.completed_at = new Date().toISOString();

  const { error } = await supabase.from("maintenance_requests").update(patch).eq("id", id);
  if (error) {
    toast.error("Could not update status");
    return false;
  }
  toast.success(`Marked ${label(status)}`);
  return true;
}
