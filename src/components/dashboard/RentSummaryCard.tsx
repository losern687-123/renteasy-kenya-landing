import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Clock, AlertCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeletons";

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
    return <CardSkeleton />;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Rent Status
        </CardTitle>
        <CardDescription>Current month overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "flex items-center gap-4 p-6 rounded-xl border-2 transition-all hover:scale-[1.02]",
            config.bgColor,
            config.borderColor
          )}
        >
          <div className={cn("rounded-xl p-3", config.bgColor)}>
            <Icon className={cn("h-10 w-10", config.color)} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
            <p className={cn("text-3xl font-bold tracking-tight", config.color)}>{config.text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
