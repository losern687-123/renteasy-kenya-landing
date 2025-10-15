import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const RentReminderBanner = () => {
  const { user } = useAuth();
  const [reminderType, setReminderType] = useState<"overdue" | "due-soon" | null>(null);
  const [daysUntilDue, setDaysUntilDue] = useState(0);

  useEffect(() => {
    const checkReminders = async () => {
      if (!user) return;

      const now = new Date();
      const { data, error } = await supabase
        .from("rent_records")
        .select("due_date, status")
        .eq("tenant_id", user.id)
        .in("status", ["Pending", "Overdue"])
        .order("due_date", { ascending: true })
        .limit(1);

      if (error || !data || data.length === 0) {
        setReminderType(null);
        return;
      }

      const record = data[0];
      const dueDate = new Date(record.due_date);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        setReminderType("overdue");
        setDaysUntilDue(Math.abs(diffDays));
      } else if (diffDays <= 7) {
        setReminderType("due-soon");
        setDaysUntilDue(diffDays);
      } else {
        setReminderType(null);
      }
    };

    checkReminders();
  }, [user]);

  if (!reminderType) return null;

  return (
    <div
      className={cn(
        "mb-6 p-4 rounded-lg border-2 flex items-start gap-3 backdrop-blur-sm",
        reminderType === "overdue"
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : "bg-secondary/10 border-secondary/30 text-secondary-foreground"
      )}
    >
      {reminderType === "overdue" ? (
        <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
      ) : (
        <Bell className="h-6 w-6 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className="font-semibold text-lg">
          {reminderType === "overdue" ? "Rent Payment Overdue!" : "Rent Due Soon!"}
        </p>
        <p className="text-sm opacity-90">
          {reminderType === "overdue"
            ? `Your rent payment is ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""} overdue. Please make payment as soon as possible.`
            : `Your rent is due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}. Don't forget to make your payment!`}
        </p>
      </div>
    </div>
  );
};
