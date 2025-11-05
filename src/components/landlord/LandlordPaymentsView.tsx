import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Filter } from "lucide-react";

interface Payment {
  id: string;
  tenant_id: string;
  property_name: string;
  amount: number;
  status: string;
  payment_date: string | null;
  due_date: string;
  tenant_name: string | null;
}

export default function LandlordPaymentsView({ refresh }: { refresh?: boolean }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterTenant, setFilterTenant] = useState("");
  const [filterProperty, setFilterProperty] = useState("");

  useEffect(() => {
    loadPayments();
  }, [user, refresh]);

  useEffect(() => {
    applyFilters();
  }, [payments, filterDate, filterTenant, filterProperty]);

  const loadPayments = async () => {
    if (!user) return;

    setLoading(true);

    // Get all tenants for this landlord
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id")
      .eq("landlord_id", user.id);

    if (tenantsError) {
      toast.error("Failed to load tenants");
      setLoading(false);
      return;
    }

    const tenantIds = tenants?.map(t => t.id) || [];

    if (tenantIds.length === 0) {
      setPayments([]);
      setFilteredPayments([]);
      setLoading(false);
      return;
    }

    // Get rent records for these tenants
    const { data, error } = await supabase
      .from("rent_records")
      .select("*")
      .in("tenant_id", tenantIds)
      .order("due_date", { ascending: false });

    if (error) {
      toast.error("Failed to load payments");
      setLoading(false);
      return;
    }

    setPayments(data || []);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (filterDate) {
      filtered = filtered.filter(p => 
        p.payment_date?.includes(filterDate) || p.due_date.includes(filterDate)
      );
    }

    if (filterTenant) {
      filtered = filtered.filter(p => 
        p.tenant_name?.toLowerCase().includes(filterTenant.toLowerCase())
      );
    }

    if (filterProperty) {
      filtered = filtered.filter(p => 
        p.property_name.toLowerCase().includes(filterProperty.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const handleConfirmPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("rent_records")
      .update({ 
        status: "Paid",
        payment_date: new Date().toISOString().split('T')[0]
      })
      .eq("id", paymentId);

    if (error) {
      toast.error("Failed to confirm payment");
      return;
    }

    toast.success("Payment confirmed successfully");
    loadPayments();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Paid: "default",
      Pending: "secondary",
      Overdue: "destructive",
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading payments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Payments</CardTitle>
        <CardDescription>View and confirm rent payments from your tenants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="filter-date">Filter by Date</Label>
            <Input
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Select date"
            />
          </div>
          <div>
            <Label htmlFor="filter-tenant">Filter by Tenant</Label>
            <Input
              id="filter-tenant"
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              placeholder="Tenant name"
            />
          </div>
          <div>
            <Label htmlFor="filter-property">Filter by Property</Label>
            <Input
              id="filter-property"
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              placeholder="Property name"
            />
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {payments.length === 0 ? "No payments found" : "No payments match the filters"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.tenant_name || "N/A"}</TableCell>
                    <TableCell>{payment.property_name}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.due_date)}</TableCell>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.status.toLowerCase() === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmPayment(payment.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirm
                        </Button>
                      )}
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
