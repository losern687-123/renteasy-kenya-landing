import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileText, Calendar, Filter } from "lucide-react";
import jsPDF from "jspdf";

interface RentRecord {
  id: string;
  property_name: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
  payment_method: string;
  receipt_url: string | null;
}

export default function TenantHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    loadRecords();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [records, filterProperty, filterStartDate, filterEndDate]);

  const loadRecords = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("rent_records")
      .select("*")
      .eq("tenant_id", user.id)
      .order("payment_date", { ascending: false, nullsFirst: false })
      .order("due_date", { ascending: false });

    if (error) {
      toast.error("Failed to load payment history");
      console.error(error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (filterProperty) {
      filtered = filtered.filter((r) =>
        r.property_name.toLowerCase().includes(filterProperty.toLowerCase())
      );
    }

    if (filterStartDate) {
      filtered = filtered.filter((r) => {
        const recordDate = r.payment_date || r.due_date;
        return recordDate >= filterStartDate;
      });
    }

    if (filterEndDate) {
      filtered = filtered.filter((r) => {
        const recordDate = r.payment_date || r.due_date;
        return recordDate <= filterEndDate;
      });
    }

    setFilteredRecords(filtered);
  };

  const calculateSummary = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyPaid = filteredRecords
      .filter((r) => {
        if (!r.payment_date) return false;
        const date = new Date(r.payment_date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear &&
          r.status.toLowerCase() === "paid"
        );
      })
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const pending = filteredRecords
      .filter((r) => r.status.toLowerCase() === "pending")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    return { monthlyPaid, pending };
  };

  const generatePDF = (record: RentRecord) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Payment Receipt", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Receipt ID: ${record.id.slice(0, 8).toUpperCase()}`, 20, 40);
    doc.text(`Property: ${record.property_name}`, 20, 50);
    doc.text(`Amount: KES ${Number(record.amount).toLocaleString()}`, 20, 60);
    doc.text(`Payment Method: ${record.payment_method || "—"}`, 20, 70);
    doc.text(`Payment Date: ${record.payment_date || "Pending"}`, 20, 80);
    doc.text(`Status: ${record.status}`, 20, 90);

    doc.setFontSize(10);
    doc.text("RentEasy Kenya", 105, 280, { align: "center" });
    doc.text("Generated on: " + new Date().toLocaleString(), 105, 285, { align: "center" });

    doc.save(`receipt-${record.id.slice(0, 8)}.pdf`);
    toast.success("Receipt downloaded successfully");
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

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">Loading payment history...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Paid (This Month)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{formatCurrency(summary.monthlyPaid)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{formatCurrency(summary.pending)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & History Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">View and download your payment records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="filter-property" className="text-xs sm:text-sm">
                  <Filter className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Property
                </Label>
                <Input
                  id="filter-property"
                  value={filterProperty}
                  onChange={(e) => setFilterProperty(e.target.value)}
                  placeholder="Filter by property"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-start" className="text-xs sm:text-sm">Start Date</Label>
                <Input
                  id="filter-start"
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-end" className="text-xs sm:text-sm">End Date</Label>
                <Input
                  id="filter-end"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Mobile Card View */}
            {filteredRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {records.length === 0 ? "No payment records found" : "No payments match the filters"}
              </p>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg bg-card space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{record.property_name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(record.payment_date || record.due_date)}</p>
                        </div>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold">{formatCurrency(record.amount)}</p>
                          <p className="text-xs text-muted-foreground">{record.payment_method || "M-Pesa"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePDF(record)}
                          className="gap-1 h-8 text-xs"
                        >
                          <Download className="h-3 w-3" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">{formatDate(record.payment_date || record.due_date)}</TableCell>
                          <TableCell className="text-sm">{record.property_name}</TableCell>
                          <TableCell className="font-medium text-sm">{formatCurrency(record.amount)}</TableCell>
                          <TableCell className="text-sm">{record.payment_method || "M-Pesa"}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generatePDF(record)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
