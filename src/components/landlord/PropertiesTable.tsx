import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";
import { VacancyStatusBadge } from "./VacancyStatusBadge";
import { Store } from "lucide-react";

interface Property {
  id: string;
  name: string;
  location: string;
  rent_amount: number;
  occupancy_status: string | null;
  available_for_listing: boolean | null;
}

interface PropertiesTableProps {
  refresh?: boolean;
  onListProperty?: (propertyId: string) => void;
}

export default function PropertiesTable({ refresh, onListProperty }: PropertiesTableProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, [user, refresh]);

  const loadProperties = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, location, rent_amount, occupancy_status, available_for_listing")
      .eq("landlord_id", user.id);

    if (error) {
      toast.error("Failed to load properties");
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setLoading(false);
  };

  const updateOccupancy = async (id: string, status: string) => {
    const { error } = await supabase
      .from("properties")
      .update({ occupancy_status: status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Property marked as ${status}`);
      loadProperties();
    }
  };

  if (loading) {
    return <TableSkeleton rows={4} columns={4} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties</CardTitle>
        <CardDescription>Your property portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No properties added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>KES {property.rent_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <VacancyStatusBadge status={property.occupancy_status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {property.occupancy_status !== "vacant" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            onClick={() => updateOccupancy(property.id, "vacant")}
                          >
                            Mark Vacant
                          </Button>
                        )}
                        {property.occupancy_status === "vacant" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            onClick={() => updateOccupancy(property.id, "occupied")}
                          >
                            Mark Occupied
                          </Button>
                        )}
                        {property.occupancy_status === "vacant" && !property.available_for_listing && onListProperty && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={() => onListProperty(property.id)}
                          >
                            <Store className="h-3 w-3" />
                            List
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
