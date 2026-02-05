import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, X } from "lucide-react";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface SubscriptionRow {
  id: string;
  landlord_id: string;
  status: string;
  billing_cycle: string;
  start_date: string;
  end_date: string | null;
  landlord: {
    name: string;
    email: string;
  };
  tier: {
    name: string;
    display_name: string;
    price_monthly: number;
    price_annual: number;
  };
}

export function SubscriptionTable() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const pageSize = 20;

  const { data: tiers } = useQuery({
    queryKey: ["subscription-tiers-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscription_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page, searchQuery, tierFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("landlord_subscriptions")
        .select(`
          *,
          landlord:profiles!landlord_id(name, email),
          tier:subscription_tiers(*)
        `, { count: "exact" });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: subscriptions, count, error } = await query
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      // Filter by search and tier client-side since we're joining tables
      let filtered = (subscriptions || []) as unknown as SubscriptionRow[];
      
      if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        filtered = filtered.filter(sub => 
          sub.landlord?.name?.toLowerCase().includes(lowerSearch) ||
          sub.landlord?.email?.toLowerCase().includes(lowerSearch)
        );
      }

      if (tierFilter !== "all") {
        filtered = filtered.filter(sub => sub.tier?.name === tierFilter);
      }

      return { subscriptions: filtered, totalCount: count || 0 };
    },
    staleTime: 30 * 1000,
  });

  const handleExportCSV = () => {
    if (!data?.subscriptions) return;

    const csvContent = [
      ["Name", "Email", "Tier", "Status", "Billing", "Start Date", "End Date", "MRR"].join(","),
      ...data.subscriptions.map(sub => [
        sub.landlord?.name || "",
        sub.landlord?.email || "",
        sub.tier?.display_name || "",
        sub.status,
        sub.billing_cycle,
        sub.start_date ? format(new Date(sub.start_date), "yyyy-MM-dd") : "",
        sub.end_date ? format(new Date(sub.end_date), "yyyy-MM-dd") : "",
        sub.billing_cycle === "annual" 
          ? Math.round((sub.tier?.price_annual || 0) / 12) 
          : (sub.tier?.price_monthly || 0),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const handleViewDetails = (subscription: SubscriptionRow) => {
    setSelectedSubscription(subscription);
    setDetailsOpen(true);
  };

  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/30";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "expired": return "bg-muted text-muted-foreground border-muted";
      case "trial": return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {tiers?.map(tier => (
              <SelectItem key={tier.id} value={tier.name}>{tier.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Landlord</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              data?.subscriptions.map((sub) => {
                const mrr = sub.billing_cycle === "annual" 
                  ? Math.round((sub.tier?.price_annual || 0) / 12) 
                  : (sub.tier?.price_monthly || 0);
                
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.landlord?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{sub.landlord?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SubscriptionBadge 
                        tier={sub.tier?.name as any || "free"} 
                        size="sm" 
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(sub.status)}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                    <TableCell>
                      {sub.start_date ? format(new Date(sub.start_date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      {sub.end_date ? format(new Date(sub.end_date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      KES {mrr.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(sub)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Change Tier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data?.totalCount || 0)} of {data?.totalCount || 0}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              Full details for {selectedSubscription?.landlord?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Landlord</p>
                  <p className="font-medium">{selectedSubscription.landlord?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedSubscription.landlord?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tier</p>
                  <SubscriptionBadge tier={selectedSubscription.tier?.name as any} size="sm" />
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={getStatusColor(selectedSubscription.status)}>
                    {selectedSubscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Billing Cycle</p>
                  <p className="font-medium capitalize">{selectedSubscription.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {selectedSubscription.start_date 
                      ? format(new Date(selectedSubscription.start_date), "MMM d, yyyy") 
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
