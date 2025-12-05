import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { TableSkeleton } from "@/components/ui/skeletons";

interface Property {
  id: string;
  name: string;
  location: string;
  rent_amount: number;
}

export default function PropertiesTable({ refresh }: { refresh?: boolean }) {
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
      .select("*")
      .eq("landlord_id", user.id);

    if (error) {
      toast.error("Failed to load properties");
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setLoading(false);
  };

  if (loading) {
    return <TableSkeleton rows={4} columns={3} />;
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Monthly Rent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>{property.name}</TableCell>
                  <TableCell>{property.location}</TableCell>
                  <TableCell>KES {property.rent_amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
