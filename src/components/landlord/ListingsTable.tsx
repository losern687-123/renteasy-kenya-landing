import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Eye, EyeOff, Trash2, Store, MessageSquare } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  property_type: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
  property: { name: string; location: string; rent_amount: number } | null;
  inquiry_count: number;
}

export default function ListingsTable({ refresh }: { refresh?: boolean }) {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, [user, refresh]);

  const loadListings = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("property_listings")
      .select(`
        id, title, property_type, is_active, views_count, created_at,
        property:properties(name, location, rent_amount)
      `)
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load listings");
      setLoading(false);
      return;
    }

    // Get inquiry counts
    const listingIds = (data || []).map(l => l.id);
    let inquiryCounts: Record<string, number> = {};

    if (listingIds.length > 0) {
      const { data: inquiries } = await supabase
        .from("property_inquiries")
        .select("listing_id")
        .in("listing_id", listingIds);

      (inquiries || []).forEach(inq => {
        inquiryCounts[inq.listing_id] = (inquiryCounts[inq.listing_id] || 0) + 1;
      });
    }

    setListings((data || []).map(l => ({
      ...l,
      property: Array.isArray(l.property) ? l.property[0] || null : l.property,
      inquiry_count: inquiryCounts[l.id] || 0,
    })));
    setLoading(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("property_listings")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update listing");
    } else {
      toast.success(currentActive ? "Listing deactivated" : "Listing activated");
      loadListings();
    }
  };

  const deleteListing = async (id: string) => {
    const { error } = await supabase
      .from("property_listings")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete listing");
    } else {
      toast.success("Listing deleted");
      loadListings();
    }
  };

  if (loading) return <TableSkeleton rows={3} columns={5} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Your Listings
        </CardTitle>
        <CardDescription>Manage your marketplace listings</CardDescription>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No listings yet. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Inquiries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map(listing => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{listing.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{listing.property_type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {listing.property ? `KES ${listing.property.rent_amount.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={listing.is_active ? "default" : "secondary"} className="text-xs">
                        {listing.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" /> {listing.views_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" /> {listing.inquiry_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleActive(listing.id, listing.is_active ?? true)}
                          title={listing.is_active ? "Deactivate" : "Activate"}
                        >
                          {listing.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteListing(listing.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
