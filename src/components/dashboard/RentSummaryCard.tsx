import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const RentSummaryCard = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"Paid" | "Pending" | "Overdue" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentMonthStatus = async () => {
      if (!user) return;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();

      const { data, error } = await supabase
        .from("rent_records")
        .select("status, due_date")
        .eq("tenant_id", user.id)
        .gte("due_date", startOfMonth)
        .lte("due_date", endOfMonth)
        .order("due_date", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching rent status:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const record = data[0];
        const dueDate = new Date(record.due_date);
        
        if (record.status === "Paid") {
          setStatus("Paid");
        } else if (now > dueDate) {
          setStatus("Overdue");
        } else {
          setStatus("Pending");
        }
      }

      setLoading(false);
    };

    fetchCurrentMonthStatus();
  }, [user]);

  const getStatusConfig = () => {
    switch (status) {
      case "Paid":
        return {
          icon: CheckCircle,
          text: "Paid",
          color: "text-primary",
          bgColor: "bg-primary/10",
          borderColor: "border-primary/20",
        };
      case "Pending":
        return {
          icon: Clock,
          text: "Pending",
          color: "text-secondary",
          bgColor: "bg-secondary/10",
          borderColor: "border-secondary/20",
        };
      case "Overdue":
        return {
          icon: AlertCircle,
          text: "Overdue",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
        };
      default:
        return {
          icon: Clock,
          text: "No Record",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-muted",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-card/50 border-2">
        <CardHeader>
          <CardTitle>Current Month Rent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-muted rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/50 border-2">
      <CardHeader>
        <CardTitle>Current Month Rent Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "flex items-center gap-4 p-6 rounded-lg border-2",
            config.bgColor,
            config.borderColor
          )}
        >
          <Icon className={cn("h-12 w-12", config.color)} />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={cn("text-2xl font-bold", config.color)}>{config.text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
