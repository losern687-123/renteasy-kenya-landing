import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeletons";
import { VacancyStatusBadge } from "./VacancyStatusBadge";
import { Store, Copy, Check, MapPin, BedDouble, Users } from "lucide-react";

interface Property {
  id: string;
  name: string;
  location: string;
  rent_amount: number;
  occupancy_status: string | null;
  available_for_listing: boolean | null;
  property_code: string;
  property_type: string | null;
  bedrooms: number | null;
  capacity: number | null;
}

interface PropertiesTableProps {
  refresh?: boolean;
  onListProperty?: (propertyId: string) => void;
}

const typeLabel = (t: string | null) => {
  if (!t) return "—";
  return t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function PropertiesTable({ refresh, onListProperty }: PropertiesTableProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { loadProperties(); }, [user, refresh]);

  const loadProperties = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, location, rent_amount, occupancy_status, available_for_listing, property_code, property_type, bedrooms, capacity")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load properties");
      setLoading(false);
      return;
    }
    setProperties(data || []);
    setLoading(false);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Property code copied");
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const updateOccupancy = async (id: string, status: string) => {
    const { error } = await supabase.from("properties").update({ occupancy_status: status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Marked as ${status}`);
    loadProperties();
  };

  if (loading) return <TableSkeleton rows={3} columns={4} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Properties</CardTitle>
        <CardDescription>Each property has a unique code tenants use to link</CardDescription>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">No properties yet — add one to get started.</p>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">{p.name}</h4>
                      <VacancyStatusBadge status={p.occupancy_status} />
                      {p.available_for_listing && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Listed</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {p.location}
                    </p>
                  </div>
                  <p className="text-base font-bold text-primary shrink-0">
                    KES {p.rent_amount.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {typeLabel(p.property_type)}</span>
                  {p.capacity != null && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Up to {p.capacity}</span>}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => copyCode(p.property_code)}
                    className="group flex items-center gap-2 text-xs font-mono tracking-wider hover:text-primary transition-colors"
                  >
                    {copiedCode === p.property_code ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    )}
                    <span className="font-bold">{p.property_code}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    {p.occupancy_status !== "vacant" ? (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => updateOccupancy(p.id, "vacant")}>
                        Mark vacant
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => updateOccupancy(p.id, "occupied")}>
                        Mark occupied
                      </Button>
                    )}
                    {p.occupancy_status === "vacant" && !p.available_for_listing && onListProperty && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onListProperty(p.id)}>
                        <Store className="w-3 h-3" /> List
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
