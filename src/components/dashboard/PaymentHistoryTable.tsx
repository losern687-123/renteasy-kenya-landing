import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeletons";

interface RentRecord {
  id: string;
  property_name: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
  created_at: string;
}

export const PaymentHistoryTable = ({ onEdit }: { onEdit?: (record: RentRecord) => void }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("rent_records")
      .select("*")
      .eq("tenant_id", user.id)
      .order("due_date", { ascending: false });

    if (error) {
      console.error("Error fetching records:", error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Paid: "default",
      Pending: "secondary",
      Overdue: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
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

  if (loading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  return (
    <Card className="backdrop-blur-sm bg-card/50 border-2">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No payment records yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first payment to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.property_name}</TableCell>
                    <TableCell>{formatCurrency(record.amount)}</TableCell>
                    <TableCell>{formatDate(record.due_date)}</TableCell>
                    <TableCell>{formatDate(record.payment_date)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(record)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
};
