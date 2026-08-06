import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ISSUE_TYPES, SEVERITIES, label } from "@/hooks/useMaintenance";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  scope: "tenant" | "landlord";
  onCreated: () => void;
}

export function NewRequestDialog({ open, onOpenChange, scope, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<string>("other");
  const [severity, setSeverity] = useState<string>("medium");
  const [locationNote, setLocationNote] = useState("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [tenantContext, setTenantContext] = useState<{ landlord_id: string; property_id: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const load = async () => {
      if (scope === "landlord") {
        const { data } = await supabase
          .from("properties")
          .select("id, name")
          .eq("landlord_id", user.id)
          .order("name");
        setProperties(data || []);
      } else {
        const { data } = await supabase
          .from("tenants")
          .select("landlord_id, property_id")
          .eq("id", user.id)
          .maybeSingle();
        setTenantContext(data ? { landlord_id: data.landlord_id, property_id: data.property_id } : null);
      }
    };
    load();
  }, [open, user, scope]);

  const reset = () => {
    setTitle(""); setDescription(""); setIssueType("other");
    setSeverity("medium"); setLocationNote(""); setPropertyId("");
  };

  const submit = async () => {
    if (!user) return;
    if (title.trim().length < 4) { toast.error("Add a short title (4+ characters)"); return; }
    if (description.trim().length < 10) { toast.error("Describe the issue (10+ characters)"); return; }

    const landlordId = scope === "landlord" ? user.id : tenantContext?.landlord_id;
    if (!landlordId) {
      toast.error("You are not linked to a landlord yet — link a property code first");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("maintenance_requests").insert({
      title: title.trim().slice(0, 140),
      description: description.trim().slice(0, 2000),
      issue_type: issueType,
      severity,
      location_note: locationNote.trim().slice(0, 200) || null,
      landlord_id: landlordId,
      tenant_id: scope === "tenant" ? user.id : null,
      property_id: scope === "landlord" ? propertyId || null : tenantContext?.property_id || null,
      created_by: user.id,
      source: scope,
      status: "open",
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not submit request");
      return;
    }
    toast.success("Maintenance request submitted");
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            {scope === "tenant"
              ? "Your landlord is notified and can track progress here."
              : "Log an issue for one of your properties."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mr-title">Title</Label>
            <Input id="mr-title" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} placeholder="Kitchen tap is leaking" />
          </div>

          {scope === "landlord" && (
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Issue type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{label(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>{label(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mr-loc">Where in the unit? (optional)</Label>
            <Input id="mr-loc" value={locationNote} maxLength={200} onChange={(e) => setLocationNote(e.target.value)} placeholder="Upstairs bathroom" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mr-desc">Description</Label>
            <Textarea id="mr-desc" value={description} maxLength={2000} rows={4} onChange={(e) => setDescription(e.target.value)} placeholder="What happened, when it started, and anything you've already tried." />
          </div>

          {severity === "emergency" && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
              Emergencies are flagged immediately for your landlord. For fire, gas or medical
              emergencies call the relevant emergency service first.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
