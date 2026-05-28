import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Check, X, Trash2, Mail, Phone, Building2, Clock } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_id: string | null;
  verification_status: string | null;
  properties?: { name: string; property_code: string } | null;
}

export default function TenantsTable({ refresh }: { refresh?: boolean }) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTenants(); }, [user, refresh]);

  const loadTenants = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select(`*, properties (name, property_code)`)
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load tenants");
      setLoading(false);
      return;
    }
    setTenants((data as any) || []);
    setLoading(false);
  };

  const approve = async (tenantId: string) => {
    const { error } = await supabase
      .from("tenants")
      .update({ verification_status: "verified" })
      .eq("id", tenantId);
    if (error) return toast.error("Failed to approve");
    toast.success("Tenant approved");
    loadTenants();
  };

  const handleDelete = async (tenantId: string) => {
    const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
    if (error) return toast.error("Failed to remove");
    toast.success("Tenant removed");
    loadTenants();
  };

  if (loading) return <TableSkeleton rows={3} columns={4} />;

  // Group tenants by property for clearer overview
  const grouped = tenants.reduce<Record<string, { propName: string; propCode: string; items: Tenant[] }>>((acc, t) => {
    const key = t.property_id || "__unassigned__";
    if (!acc[key]) {
      acc[key] = {
        propName: t.properties?.name || "Unassigned",
        propCode: t.properties?.property_code || "",
        items: [],
      };
    }
    acc[key].items.push(t);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants by property</CardTitle>
        <CardDescription>Approve new linking requests and manage tenants</CardDescription>
      </CardHeader>
      <CardContent>
        {tenants.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No tenants yet. Share a property code with a tenant to get started.
          </p>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">{group.propName}</h4>
                  {group.propCode && (
                    <span className="text-[11px] font-mono text-muted-foreground tracking-wider">{group.propCode}</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{group.items.length} tenant{group.items.length > 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {group.items.map((tenant) => {
                    const pending = tenant.verification_status !== "verified" && tenant.verification_status !== "approved";
                    return (
                      <div
                        key={tenant.id}
                        className="rounded-lg border bg-card p-3 flex items-start gap-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                          {tenant.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{tenant.name}</p>
                            {pending ? (
                              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/10 gap-1">
                                <Clock className="w-2.5 h-2.5" /> Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10">Approved</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {tenant.email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {tenant.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {pending && (
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => approve(tenant.id)}>
                              <Check className="w-3 h-3" /> Approve
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove tenant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove {tenant.name}? This unlinks them but doesn't delete their account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(tenant.id)}>Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
