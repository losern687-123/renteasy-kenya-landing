import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { logActivity, ActivityActions, EntityTypes } from "@/utils/activityLogger";

const formSchema = z.object({
  property_name: z.string().min(1, "Property name is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid positive number",
  }),
  payment_date: z.string().optional(),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["Paid", "Pending", "Overdue"]),
});

type FormData = z.infer<typeof formSchema>;

export const AddPaymentForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_name: "",
      amount: "",
      payment_date: "",
      due_date: "",
      status: "Pending",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a payment record",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { data: insertedData, error } = await supabase.from("rent_records").insert({
      tenant_id: user.id,
      property_name: data.property_name,
      amount: Number(data.amount),
      payment_date: data.payment_date || null,
      due_date: data.due_date,
      status: data.status,
    }).select().single();

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add payment record. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Log activity
    await logActivity({
      action: ActivityActions.PAYMENT_RECORDED,
      entityType: EntityTypes.PAYMENT,
      entityId: insertedData.id,
      details: {
        property_name: data.property_name,
        amount: Number(data.amount),
        status: data.status,
      }
    });

    toast({
      title: "Success",
      description: "Payment record added successfully!",
    });

    form.reset();
    onSuccess?.();
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Add Rent Payment Record</CardTitle>
        <CardDescription>Track your rent payments and keep your records organized</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="property_name">Property Name</Label>
            <Input
              id="property_name"
              placeholder="e.g., Apartment 101, Nairobi"
              {...form.register("property_name")}
            />
            {form.formState.errors.property_name && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.property_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Rent Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 25000"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="date" {...form.register("due_date")} />
            {form.formState.errors.due_date && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.due_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="payment_date">Payment Date (Optional)</Label>
            <Input id="payment_date" type="date" {...form.register("payment_date")} />
          </div>

          <div>
            <Label htmlFor="status">Payment Status</Label>
            <Select onValueChange={(value) => form.setValue("status", value as any)} defaultValue="Pending">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-gradient-hero hover:opacity-90 transition-all hover:scale-[1.02]" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Adding..." : "Add Payment Record"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
